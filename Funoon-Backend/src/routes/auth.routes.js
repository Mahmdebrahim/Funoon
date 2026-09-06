const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");

const authController = require("../controllers/auth.controller");
const { protect } = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validation.middleware");

const {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  verifyEmailValidator,
  resendOtpValidator,
} = require("../validators/auth.validator");

// ─── Rate Limiters ──────────────────────────────────────────────────────────
const resendOtpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 resend attempts per IP per hour
  message: { success: false, message: "تم تجاوز الحد المسموح — حاول لاحقاً" },
  standardHeaders: true,
  legacyHeaders: false,
});

const verifyOtpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // anti-brute force
  message: { success: false, message: "تجاوزت عدد المحاولات — حاول بعد قليل" },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Public Routes ──────────────────────────────────────────────────────────
router.post("/register", registerValidator, validate, authController.register);
router.post("/login", loginValidator, validate, authController.login);
router.post("/refresh-token", authController.refreshToken);
router.post(
  "/forgot-password",
  forgotPasswordValidator,
  validate,
  authController.forgotPassword,
);
router.post(
  "/reset-password",
  resetPasswordValidator,
  validate,
  authController.resetPassword,
);

// ─── Email Verification Routes (Public — لا تحتاج protect) ─────────────────
router.post(
  "/verify-email",
  verifyOtpLimiter,
  verifyEmailValidator,
  validate,
  authController.verifyEmail,
);
router.post(
  "/resend-otp",
  resendOtpLimiter,
  resendOtpValidator,
  validate,
  authController.resendVerificationOTP,
);
router.get("/verify-status/:userId", authController.checkVerificationStatus);

// ─── Protected Routes ───────────────────────────────────────────────────────
router.post("/logout", protect, authController.logout);
router.get("/me", protect, authController.getMe);

module.exports = router;
