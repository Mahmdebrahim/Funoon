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
const logger = require("../utils/logger")

// Helper: Get consistent cookie options
const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 90 * 24 * 60 * 60 * 1000, // 90 days
  path: "/",
});

const generateRefreshToken = async (user) => {
  // ✅ امسح tokens القديمة، سيب آخر 5 بس (بدل كلهم)
  const existingTokens = await RefreshToken.find({ user: user._id })
    .sort({ createdAt: -1 })
    .limit(100); // اجيب كلهم

  if (existingTokens.length > 5) {
    const tokensToDelete = existingTokens.slice(5).map((t) => t._id);
    await RefreshToken.deleteMany({ _id: { $in: tokensToDelete } });
  }

  const token = crypto.randomBytes(40).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 90);

  await RefreshToken.create({
    token,
    user: user._id,
    expiresAt,
  });

  return token;
};

const generateAccessToken = (user) => {
  return jwt.sign(
    { userId: user._id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "15m" },
  );
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

  // 2. Create user (unverified)
  const user = await User.create({
    name,
    email,
    password,
    phone,
    role,
    termsAccepted,
    emailVerified: false,
  });

  // 3. Generate OTP
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  user.emailVerificationOTP = crypto
    .createHash("sha256")
    .update(otp)
    .digest("hex");
  user.emailVerificationOTPExpires = Date.now() + 5 * 60 * 1000; // 10 min
  user.otpLastSentAt = new Date();
  await user.save({ validateBeforeSave: false });

  // 4. Send OTP Email
  const emailSent = await EmailService.sendVerificationOTP(user, otp);
  if (!emailSent) {
    user.emailVerificationOTP = undefined;
    user.emailVerificationOTPExpires = undefined;
    user.otpLastSentAt = undefined;
    await user.save({ validateBeforeSave: false });
    throw new Error("فشل إرسال بريد التأكيد. يرجى المحاولة مرة أخرى.");
  }

  // 5. ⚠️ لا نرجع tokens — فقط userId + email للـ verify page
  return ApiResponse.created(
    res,
    { userId: user._id, email: user.email },
    "تم إرسال رمز التأكيد إلى بريدك الإلكتروني",
  );
});

// @desc    Log in user
// @route   POST /api/v1/auth/login
// @access  Public
const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select(
    "+password +isActive +emailVerificationOTP +emailVerificationOTPExpires +otpAttempts +otpLockedUntil +otpLastSentAt",
  );

  if (!user || !user.isActive) {
    logger.warn(`❌ Failed login attempt for: ${email}`);
    throw new UnauthorizedError("بيانات الدخول غير صحيحة");
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    logger.warn(`❌ Wrong password for: ${email}`);
    throw new UnauthorizedError("بيانات الدخول غير صحيحة");
  }

  if (!user.emailVerified) {
    const now = new Date();
    const resetTime = user.otpDailyCountResetAt
      ? new Date(user.otpDailyCountResetAt)
      : now;
    if (now.toDateString() !== resetTime.toDateString()) {
      user.otpDailyCount = 0;
      user.otpDailyCountResetAt = now;
    }

    if (user.otpDailyCount >= 10) {
      throw new BadRequestError(
        "تم تجاوز الحد اليومي لرموز التأكيد — حاول غداً",
      );
    }

    user.otpDailyCount += 1;
    const lastSent = user.otpLastSentAt ? new Date(user.otpLastSentAt) : null;
    const canResend = !lastSent || now - lastSent > 60 * 1000;

    if (canResend) {
      const otp = String(Math.floor(100000 + Math.random() * 900000));
      user.emailVerificationOTP = crypto
        .createHash("sha256")
        .update(otp)
        .digest("hex");
      user.emailVerificationOTPExpires = Date.now() + 5 * 60 * 1000;
      user.otpAttempts = 0;
      user.otpLockedUntil = undefined;
      user.otpLastSentAt = now;
      await user.save({ validateBeforeSave: false });
      EmailService.sendVerificationOTP(user, otp).catch(() => {});
    }

    const err = new UnauthorizedError(
      "يرجى تأكيد بريدك الإلكتروني أولاً — أعدنا إرسال رمز جديد",
    );
    err.statusCode = 401;
    err.data = {
      needsVerification: true,
      userId: user._id.toString(),
      email: user.email,
    };
    throw err;
  }

  logger.info(`✅ Login successful for: ${email}`);

  const accessToken = generateAccessToken(user);
  const refreshToken = await generateRefreshToken(user);

  res.cookie("refreshToken", refreshToken, getCookieOptions());

  user.password = undefined;
  user.isActive = undefined;

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
  if (!token) throw new UnauthorizedError("No refresh token provided");

  const storedToken = await RefreshToken.findOne({
    token,
    expiresAt: { $gt: new Date() },
  }).populate({ path: "user", select: "+isActive" });

  if (!storedToken) {
    const stolenToken = await RefreshToken.findOne({ token });
    if (stolenToken) {
      logger.warn(`🚨 Refresh token reuse detected! User: ${stolenToken.user}`);
      await RefreshToken.deleteMany({ user: stolenToken.user });
    }
    res.clearCookie("refreshToken", getCookieOptions());
    throw new UnauthorizedError("جلسة منتهية — يرجى تسجيل الدخول مرة أخرى");
  }

  const user = storedToken.user;
  if (!user || !user.isActive) {
    await RefreshToken.deleteOne({ _id: storedToken._id });
    throw new UnauthorizedError("User account is disabled");
  }

  // ✅ امسح الـ token القديم
  await RefreshToken.deleteOne({ _id: storedToken._id });

  // ✅ اعمل tokens جديدة
  const newAccessToken = generateAccessToken(user);
  const newRefreshToken = await generateRefreshToken(user);

  res.cookie("refreshToken", newRefreshToken, getCookieOptions());

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
  const token = req.cookies.refreshToken;

  if (token) {
    await RefreshToken.deleteOne({ token });
  }

  res.clearCookie("refreshToken", getCookieOptions());

  return ApiResponse.success(res, null, "Logged out successfully");
});

// @desc    Request password reset token
// @route   POST /api/v1/auth/forgot-password
// @access  Public
const forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    logger.warn(`⚠️ Password reset requested for non-existent email: ${email}`);
    return ApiResponse.success(
      res,
      null,
      "إذا كان البريد الإلكتروني مسجلاً لدينا، سيتم إرسال رابط الاستعادة خلال دقائق.",
    );
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
  const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password?token=${resetToken}`;
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

// @desc    Verify email using OTP
// @route   POST /api/v1/auth/verify-email
// @access  Public
const verifyEmail = catchAsync(async (req, res, next) => {
  const { userId, otp } = req.body;

  // Hash الـ OTP المُدخل
  const hashedOtp = crypto.createHash("sha256").update(String(otp)).digest("hex");

  // ابحث عن المستخدم مع الحقول المطلوبة
  const user = await User.findById(userId).select(
    "+emailVerificationOTP +emailVerificationOTPExpires +otpAttempts +otpLockedUntil +otpLastSentAt +isActive",
  );

  if (!user || !user.isActive) {
    throw new BadRequestError("رمز التأكيد غير صحيح أو منتهي الصلاحية");
  }

  if (user.emailVerified) {
    throw new BadRequestError("البريد الإلكتروني مؤكد بالفعل");
  }

  // تحقق من القفل
  if (user.otpLockedUntil && user.otpLockedUntil > new Date()) {
    const minutesLeft = Math.ceil((user.otpLockedUntil - Date.now()) / 60000);
    throw new UnauthorizedError(
      `تم قفل التأكيد مؤقتاً — حاول بعد ${minutesLeft} دقيقة`,
    );
  }

  // تحقق من انتهاء الصلاحية أو عدم تطابق الـ OTP
  const isValidOtp =
    user.emailVerificationOTP === hashedOtp &&
    user.emailVerificationOTPExpires > Date.now();

  if (!isValidOtp) {
    // زيّد عداد المحاولات الفاشلة
    user.otpAttempts = (user.otpAttempts || 0) + 1;

    if (user.otpAttempts >= 5) {
      user.otpLockedUntil = new Date(Date.now() + 15 * 60 * 1000);
      await user.save({ validateBeforeSave: false });
      throw new UnauthorizedError(
        "تم قفل التأكيد مؤقتاً لكثرة المحاولات — حاول بعد 15 دقيقة",
      );
    }

    await user.save({ validateBeforeSave: false });
    throw new BadRequestError("رمز التأكيد غير صحيح أو منتهي الصلاحية");
  }

  // ✅ OTP صحيح — فعّل الحساب
  user.emailVerified = true;
  user.emailVerificationOTP = undefined;
  user.emailVerificationOTPExpires = undefined;
  user.otpAttempts = 0;
  user.otpLockedUntil = undefined;
  await user.save({ validateBeforeSave: false });

  // أنشئ tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = await generateRefreshToken(user);
  res.cookie("refreshToken", refreshToken, getCookieOptions());

  // إرسال بريد ترحيب
  EmailService.sendWelcomeEmail(user).catch(() => {});

  return ApiResponse.success(
    res,
    { user: { _id: user._id, name: user.name, email: user.email, role: user.role, emailVerified: user.emailVerified }, accessToken },
    "تم تأكيد بريدك الإلكتروني بنجاح",
  );
});

// @desc    Resend verification OTP
// @route   POST /api/v1/auth/resend-otp
// @access  Public
const resendVerificationOTP = catchAsync(async (req, res, next) => {
  const { userId } = req.body;

  const user = await User.findById(userId).select(
    "+emailVerificationOTP +emailVerificationOTPExpires +otpAttempts +otpLockedUntil +otpLastSentAt +isActive",
  );

  // رسالة عامة لمنع user enumeration
  if (!user || !user.isActive) {
    return ApiResponse.success(
      res,
      null,
      "إذا كان الحساب موجوداً، سيتم إرسال رمز جديد",
    );
  }

  if (user.emailVerified) {
    throw new BadRequestError("البريد الإلكتروني مؤكد بالفعل");
  }

  // تحقق من cooldown: 60 ثانية بين كل إرسال
  // Reset counter لو يوم جديد
  const now = new Date();
  const resetTime = user.otpDailyCountResetAt
    ? new Date(user.otpDailyCountResetAt)
    : now;
  if (now.toDateString() !== resetTime.toDateString()) {
    user.otpDailyCount = 0;
    user.otpDailyCountResetAt = now;
  }

  // Check limit (10 OTPs/day)
  if (user.otpDailyCount >= 10) {
    throw new BadRequestError("تم تجاوز الحد اليومي لرموز التأكيد — حاول غداً");
  }

  user.otpDailyCount += 1;
  if (user.otpLastSentAt) {
    const secondsSinceLast = (now - new Date(user.otpLastSentAt)) / 1000;
    if (secondsSinceLast < 60) {
      const waitSeconds = Math.ceil(60 - secondsSinceLast);
      throw new BadRequestError(`انتظر ${waitSeconds} ثانية قبل إعادة الإرسال`);
    }
  }

  // أنشئ OTP جديد
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  user.emailVerificationOTP = crypto
    .createHash("sha256")
    .update(otp)
    .digest("hex");
  user.emailVerificationOTPExpires = Date.now() + 5 * 60 * 1000;
  user.otpLastSentAt = now;
  user.otpAttempts = 0; // reset attempts على الـ OTP الجديد
  user.otpLockedUntil = undefined;
  await user.save({ validateBeforeSave: false });

  const emailSent = await EmailService.sendVerificationOTP(user, otp);
  if (!emailSent) {
    throw new Error("فشل إرسال البريد الإلكتروني. يرجى المحاولة لاحقاً.");
  }

  return ApiResponse.success(
    res,
    null,
    "تم إعادة إرسال الرمز إلى بريدك الإلكتروني",
  );
});

// @desc    Check email verification status
// @route   GET /api/v1/auth/verify-status/:userId
// @access  Public
const checkVerificationStatus = catchAsync(async (req, res, next) => {
  const { userId } = req.params;
  const user = await User.findById(userId).select("emailVerified");
  if (!user) {
    // رسالة عامة
    return ApiResponse.success(res, { emailVerified: false }, "Status fetched");
  }
  return ApiResponse.success(res, { emailVerified: user.emailVerified }, "Status fetched");
});

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  getMe,
  verifyEmail,
  resendVerificationOTP,
  checkVerificationStatus,
};
