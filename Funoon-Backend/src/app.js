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

const app = express();

// ─── Security Middlewares ────────────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin:"http://localhost:5173",
    credentials: true,
  }),
);

// ─── Rate Limiting ───────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
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
  (req, res) => {
    // حول الـ Buffer لـ string وبعدين parse
    try {
      const bodyString = Buffer.isBuffer(req.body)
        ? req.body.toString("utf8")
        : req.body;
      req.body = JSON.parse(bodyString);
    } catch (err) {
      logger.error("❌ Moyasar webhook parse error:", err.message);
      return res.status(400).json({ error: "Invalid JSON" });
    }
    // حول لـ webhook router
    const { handleMoyasarWebhook } = require("./controllers/order.controller");
    return handleMoyasarWebhook(req, res);
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
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

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
app.use(`/api/${apiVersion}/auth`, require("./routes/auth.routes"));
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
app.use(
  `/api/${apiVersion}/subscriptions`,
  require("./routes/subscription.routes"),
);
app.use(
  `/api/${apiVersion}/admin/withdrawals`,
  require("./routes/admin-withdrawal.routes"),
);

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
