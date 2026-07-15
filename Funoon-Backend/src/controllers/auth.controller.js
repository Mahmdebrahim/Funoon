const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const RefreshToken = require("../models/RefreshToken");
const EmailService = require("../services/email.service");
const {
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
} = require("../utils/api-error");
const ApiResponse = require("../utils/api-response");
const catchAsync = require("../utils/catch-async");

const generateAccessToken = (user) => {
  return jwt.sign(
    { userId: user._id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "15m" },
  );
};

const generateRefreshToken = async (user) => {
  await RefreshToken.deleteMany({
    user: user._id,
    // سيب آخر 3 tokens بس (لو بيستخدم أجهزة متعددة)
    // أو امسح كلهم
  });
  const token = crypto.randomBytes(40).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 90); // 90 days
  await RefreshToken.create({
    token,
    user: user._id,
    expiresAt,
  });

  return token;
};

// @desc    Register a new user
// @route   POST /api/v1/auth/register
// @access  Public
const register = catchAsync(async (req, res, next) => {
  const { name, email, password, phone, role, termsAccepted } = req.body;

  // 1. Check duplicate email
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new BadRequestError("Email already exists");
  }

  // 2. Create user
  const user = await User.create({
    name,
    email,
    password,
    phone,
    role,
    termsAccepted,
  });

  // 3. Generate tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = await generateRefreshToken(user);

  // 4. Set Refresh Token in HttpOnly Cookie
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 90 * 24 * 60 * 60 * 1000, // 90 days
  });

  // 5. Send Welcome Email
  EmailService.sendWelcomeEmail(user);

  // 6. Hide password
  user.password = undefined;

  // 7. Return ONLY user and accessToken in body
  return ApiResponse.created(
    res,
    { user, accessToken },
    "User registered successfully",
  );
});

// @desc    Log in user
// @route   POST /api/v1/auth/login
// @access  Public
const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password +isActive");
  if (!user || !user.isActive) {
    throw new UnauthorizedError("Invalid credentials");
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new UnauthorizedError("Invalid credentials");
  }

  // 1. Generate tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = await generateRefreshToken(user);

  // 2. Set Refresh Token in HttpOnly Cookie ✅
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true, // JavaScript in frontend cannot access it (XSS protection)
    secure: process.env.NODE_ENV === "production", // true in production (HTTPS), false in dev
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // strict/lax for dev, none for cross-origin prod
    maxAge: 90 * 24 * 60 * 60 * 1000, // 90 days
    domain: "localhost",
  });

  // 3. Clean up sensitive data
  user.password = undefined;
  user.isActive = undefined;

  // 4. Return ONLY user and accessToken in the body
  return ApiResponse.success(
    res,
    { user, accessToken },
    "Logged in successfully",
  );
});

// @desc    Refresh access token
// @route   POST /api/v1/auth/refresh-token
// @access  Public
const refreshToken = catchAsync(async (req, res, next) => {
  const token = req.cookies.refreshToken;

  console.log("Cookie token (first 30):", token?.substring(0, 30));

  // شوف أول token في الـ DB
  const sample = await RefreshToken.findOne({});
  console.log("DB token sample (first 30):", sample?.token?.substring(0, 30));
  console.log("DB expiresAt:", sample?.expiresAt);
  console.log("Now:", new Date());

  // جرب من غير الـ expiry filter الأول
  const withoutExpiry = await RefreshToken.findOne({ token });
  console.log("Found without expiry filter:", withoutExpiry ? "✅" : "❌");

  const storedToken = await RefreshToken.findOneAndDelete({
    token,
    expiresAt: { $gt: new Date() },
  }).populate({ path: "user", select: "+isActive" });

  console.log("Found with expiry filter:", storedToken ? "✅" : "❌");
  if (!storedToken) {
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });
    throw new UnauthorizedError("Invalid session.");
  }

  const user = storedToken.user;
  if (!user || !user.isActive) {
    throw new UnauthorizedError("User account is disabled");
  }

  // عمل token جديد
  const newAccessToken = generateAccessToken(user);
  const newRefreshToken = await generateRefreshToken(user);

  res.cookie("refreshToken", newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 90 * 24 * 60 * 60 * 1000,
  });

  return ApiResponse.success(
    res,
    { accessToken: newAccessToken },
    "Access token refreshed successfully",
  );
});

// @desc    Log out user / revoke refresh token
// @route   POST /api/v1/auth/logout
// @access  Private
const logout = catchAsync(async (req, res, next) => {
  // 1. Get token from cookies
  const token = req.cookies.refreshToken;

  if (token) {
    // 2. Delete from DB
    await RefreshToken.deleteOne({ token });
  }

  // 3. Clear the cookie from the browser
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  });

  return ApiResponse.success(res, null, "Logged out successfully");
});

// @desc    Request password reset token
// @route   POST /api/v1/auth/forgot-password
// @access  Public
const forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    throw new NotFoundError("No account found with this email");
  }

  // 1. Generate token
  const resetToken = crypto.randomBytes(32).toString("hex");

  // 2. Hash and save to user
  user.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  await user.save({ validateBeforeSave: false });

  // 3. Send Email
  const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password?token=${resetToken}`;
  // if (process.env.NODE_ENV === "development") {
  //   console.log("🔑 Password Reset URL:", resetUrl);
  //   return ApiResponse.success(
  //     res,
  //     { resetUrl }, // ← ارجعه في الـ response عشان تقدر تتيست
  //     "Password reset link sent to email",
  //   );
  // }
  const emailSent = await EmailService.sendPasswordResetEmail(user, resetUrl);

  if (!emailSent) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    throw new Error("Error sending email. Please try again later.");
  }

  return ApiResponse.success(res, null, "Password reset link sent to email");
});

// @desc    Reset password using token
// @route   POST /api/v1/auth/reset-password
// @access  Public
const resetPassword = catchAsync(async (req, res, next) => {
  const { token, password } = req.body;
  if (!token) {
    throw new BadRequestError("Token is required");
  }

  // 1. Hash token
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  // 2. Find user with valid token & expiry
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    throw new BadRequestError("Token is invalid or has expired");
  }

  // 3. Set new password
  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.passwordChangedAt = Date.now();
  await user.save();

  // 4. Revoke all active refresh tokens for this user
  await RefreshToken.deleteMany({ user: user._id });

  return ApiResponse.success(res, null, "Password reset successfully");
});

// @desc    Get current user
// @route   GET /api/v1/auth/me
// @access  Private
const getMe = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  return ApiResponse.success(res, user, "Current user details fetched");
});

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  getMe,
};
