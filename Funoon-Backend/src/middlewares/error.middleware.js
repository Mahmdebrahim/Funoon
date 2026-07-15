const logger = require("../utils/logger");

const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  // Log the error
  logger.error(
    `${err.statusCode} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`,
    { stack: err.stack },
  );

  // Handle Mongoose Bad ObjectId
  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: `Invalid ${err.path}: ${err.value}.`,
      error: err.name,
    });
  }

  // Handle Mongoose Duplicate Key Error
  if (err.code === 11000) {
    const match = err.errmsg ? err.errmsg.match(/(["'])(\\?.)*?\1/) : null;
    const value = match ? match[0] : "";
    return res.status(400).json({
      success: false,
      message: `Duplicate field value: ${value}. Please use another value!`,
      error: "DuplicateKeyError",
    });
  }

  // Handle Mongoose ValidationError
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((el) => el.message);
    return res.status(400).json({
      success: false,
      message: `Invalid input data: ${errors.join(". ")}`,
      error: err.name,
    });
  }

  // Handle JWT Errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Invalid token. Please log in again.",
      error: err.name,
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message: "Your token has expired. Please log in again.",
      error: err.name,
    });
  }

  // Standard response
  res.status(err.statusCode).json({
    success: false,
    message: err.message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = errorHandler;
