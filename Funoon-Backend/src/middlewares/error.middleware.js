const logger = require("../utils/logger");

const escapeHtml = (str) =>
  String(str ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c],
  );

const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  logger.error(
    `${err.statusCode} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`,
    { stack: err.stack },
  );

  // ✅ CastError
  if (err.name === "CastError") {
    const path = escapeHtml(err.path || "field");
    const value = escapeHtml(String(err.value ?? ""));
    return res.status(400).json({
      success: false,
      message: `قيمة غير صالحة للحقل "${path}"`,
    });
  }

  // ✅ DuplicateKeyError — escape الـ value
  if (err.code === 11000) {
    const match = err.errmsg ? err.errmsg.match(/(["'])(\\?.)*?\1/) : null;
    const value = match ? escapeHtml(match[0]) : "القيمة";
    return res.status(400).json({
      success: false,
      message: `القيمة ${value} مستخدمة مسبقاً. يرجى اختيار قيمة أخرى.`,
    });
  }

  // ✅ ValidationError — escape كل message
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors)
      .map((el) => escapeHtml(el.message))
      .join(" — ");
    return res.status(400).json({
      success: false,
      message: `بيانات غير صالحة: ${errors}`,
    });
  }

  // ✅ JWT — عربي
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "جلسة غير صالحة. يرجى تسجيل الدخول مرة أخرى.",
    });
  }
  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message: "انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.",
    });
  }

  // ✅ Standard response — escape الـ message دايماً
  res.status(err.statusCode).json({
    success: false,
    message: escapeHtml(err.message || "حدث خطأ غير متوقع"),
    ...(err.data && { data: err.data }),
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = errorHandler;
