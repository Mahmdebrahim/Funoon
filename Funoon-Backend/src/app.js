// src/app.js
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("./utils/logger");
const errorHandler = require("./middlewares/error.middleware.js");
const mongoSanitize = require("express-mongo-sanitize");
const { verifyMoyasarSignature } = require("./utils/webhook-signature");
require("./events/subscribers/notification.subscriber");
require("./events/subscribers/email.subscriber");

const app = express();

// ─── Security Middlewares ────────────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        connectSrc: ["'self'", "https://api.moyasar.com"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }),
);

const allowedOrigins = (
  process.env.CORS_ORIGINS ||
  "https://funoon-beta.vercel.app/" ||
  "http://localhost:5173/"
)
  .split(",")
  .map((s) => s.trim());

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) cb(null, true);
      else cb(new Error("CORS not allowed"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
}))

app.set("trust proxy", 1);

// ─── Rate Limiting ───────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: "تجاوزت عدد المحاولات — حاول بعد 15 دقيقة" },
  standardHeaders: true,
  skipSuccessfulRequests: false,
});

app.use("/api", limiter);

// ─── API Version ─────────────────────────────────────────────────────────────
const apiVersion = process.env.API_VERSION || "v1";

// ═══════════════════════════════════════════════════════════════════════════════
// ⚠️ مهم جداً: الـ Webhooks لازم تكون قبل express.json()!
// ═══════════════════════════════════════════════════════════════════════════════

// ✅ Moyasar Webhook - express.raw (Buffer) - لازم قبل express.json
app.post(
  `/api/${apiVersion}/webhooks/moyasar`,
  express.raw({ type: "application/json" }),
  (req, res, next) => {
    try {
      const rawBody = Buffer.isBuffer(req.body)
        ? req.body.toString("utf8")
        : String(req.body || "");

      // ✅ Moyasar بيبعت الـ signature في header واحد من دول
      const signature =
        req.headers["x-moyasar-signature"] ||
        req.headers["x-signature"] ||
        req.headers["moyasar-signature"] ||
        req.headers["signature"];

      // ✅ تحقق من الـ signature قبل الـ parse
      if (!verifyMoyasarSignature(rawBody, signature)) {
        logger.warn(`🚨 Invalid Moyasar webhook signature from ${req.ip}`);
        return res.status(401).json({ error: "Invalid signature" });
      }

      req.body = JSON.parse(rawBody);
      req.rawBody = rawBody; // متاح للـ handler لو احتاج
    } catch (err) {
      logger.error("❌ Moyasar webhook parse error:", err.message);
      return res.status(400).json({ error: "Invalid JSON" });
    }

    const { handleMoyasarWebhook } = require("./controllers/order.controller");
    return handleMoyasarWebhook(req, res, next);
  },
);

// ✅ OTO Webhook - express.text (string) - OTO بيبعت JSON كـ string
app.post(
  `/api/${apiVersion}/webhooks/oto`,
  express.text({ type: ["application/json", "text/plain", "application/*"] }),
  (req, res) => {
    // حول الـ string لـ object
    try {
      if (typeof req.body === "string") {
        req.body = JSON.parse(req.body);
      }
    } catch (err) {
      logger.error("❌ OTO webhook parse error:", err.message);
      logger.error("   Raw body:", req.body);
      return res.status(400).json({ error: "Invalid JSON" });
    }
    // حول لـ webhook handler
    const { handleOTOWebhook } = require("./controllers/shipping.controller");
    return handleOTOWebhook(req, res);
  },
);

// ═══════════════════════════════════════════════════════════════════════════════
// Body Parsing (بعد الـ webhooks!)
// ═══════════════════════════════════════════════════════════════════════════════
app.use(express.json({ limit: "10mb" }));
app.use(mongoSanitize());
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// ─── Logging ─────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(
    morgan("combined", {
      stream: { write: (message) => logger.info(message.trim()) },
    }),
  );
}

// ─── Static Files ────────────────────────────────────────────────────────────
app.use(
  "/uploads",
  (req, res, next) => {
    // السماح للمتصفح بعرض الصور من origin مختلف
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    next();
  },
  express.static(path.join(__dirname, "../uploads")),
);

// ─── Health Check ────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// ─── API Routes ──────────────────────────────────────────────────────────────
app.use(
  `/api/${apiVersion}/auth`,
  authLimiter,
  require("./routes/auth.routes"),
);
app.use(`/api/${apiVersion}/users`, require("./routes/user.routes"));
app.use(
  `/api/${apiVersion}/bank-account`,
  require("./routes/bank-account.routes"),
);
app.use(`/api/${apiVersion}/artists`, require("./routes/artist.routes"));
app.use(`/api/${apiVersion}/artworks`, require("./routes/artwork.routes"));
app.use(`/api/${apiVersion}/cart`, require("./routes/cart.routes"));
app.use(`/api/${apiVersion}/favorites`, require("./routes/favorite.routes"));
app.use(`/api/${apiVersion}/orders`, require("./routes/order.routes"));
app.use(`/api/${apiVersion}/shipping`, require("./routes/shipping.routes"));
app.use(
  `/api/${apiVersion}/withdrawals`,
  require("./routes/withdrawal.routes"),
);
app.use(`/api/${apiVersion}/wallet`, require("./routes/wallet.routes"));
app.use(
  `/api/${apiVersion}/subscriptions`,
  require("./routes/subscription.routes"),
);
app.use(`/api/${apiVersion}/admin`, require("./routes/admin.routes"));
app.use(
  `/api/${apiVersion}/notifications`,
  require("./routes/notification.routes"),
);
app.use(`/api/${apiVersion}/reviews`, require("./routes/review.routes"));
app.use(`/api/${apiVersion}/support`, require("./routes/support.routes"));

// ✅ شيل السطر ده! (webhookRouter متكرر)
// app.use(`/api/${apiVersion}/webhooks`, require("./routes/webhook.routes"));

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// ─── Global Error Handler ────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
