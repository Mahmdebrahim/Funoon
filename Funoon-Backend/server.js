// server.js
const dotenv = require("dotenv");

// Load environment variables FIRST
dotenv.config();

const app = require("./src/app");
const { connectDB } = require("./src/config");
const logger = require("./src/utils/logger");

// ─── Handle Uncaught Exceptions ──────────────────────────────────────────────
process.on("uncaughtException", (err) => {
  logger.error(`UNCAUGHT EXCEPTION!  Shutting down...`);
  logger.error(err.name, err.message);
  process.exit(1);
});

// ─── Connect to Database ─────────────────────────────────────────────────────
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Start server
    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, () => {
      logger.info(` Server running on port ${PORT}`);
      logger.info(` Environment: ${process.env.NODE_ENV || "development"}`);
      logger.info(` Health check: http://localhost:${PORT}/health`);
    });

    // ─── Handle Unhandled Rejections ─────────────────────────────────────────
    process.on("unhandledRejection", (err) => {
      logger.error(`UNHANDLED REJECTION!  Shutting down...`);
      logger.error(err.name, err.message);
      server.close(() => {
        process.exit(1);
      });
    });

    // ─── Graceful Shutdown ───────────────────────────────────────────────────
    process.on("SIGTERM", () => {
      logger.info(" SIGTERM received. Shutting down gracefully...");
      server.close(() => {
        logger.info(" Process terminated!");
        process.exit(0);
      });
    });

    process.on("SIGINT", () => {
      logger.info(" SIGINT received. Shutting down gracefully...");
      server.close(() => {
        logger.info("Process terminated!");
        process.exit(0);
      });
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
