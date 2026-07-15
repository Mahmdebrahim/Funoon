const express = require("express");
const router = express.Router();

const authController = require("../controllers/auth.controller");
const { protect } = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validation.middleware");

const {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
} = require("../validators/auth.validator");

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

// ─── Protected Routes ───────────────────────────────────────────────────────
router.post("/logout", protect, authController.logout);
router.get("/me", protect, authController.getMe);

module.exports = router;
