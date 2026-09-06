const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { UnauthorizedError, ForbiddenError } = require("../utils/api-error");
const catchAsync = require("../utils/catch-async");

const optionalAuth = catchAsync(async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const currentUser = await User.findById(decoded.userId).select(
        "+isActive",
      );

      if (currentUser && currentUser.isActive && !currentUser.isBanned) {
        req.user = currentUser;
      }
    } catch (err) {
      // تجاهل
    }
  }

  next();
});

// protect - Verify JWT and attach user to request
const protect = catchAsync(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    throw new UnauthorizedError(
      "You are not logged in. Please log in to get access.",
    );
  }

  // Verify token
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    throw new UnauthorizedError("Invalid token. Please log in again.");
  }

  // Check if user still exists
  const currentUser = await User.findById(decoded.userId).select("+isActive");

  if (!currentUser) {
    // ✅ الأول: user موجود؟
    throw new UnauthorizedError(
      "The user belonging to this token no longer exists.",
    );
  }

  if (currentUser.isBanned) {
    // ✅ بعدين: محظور؟
    throw new UnauthorizedError(
      "حسابك محظور من المنصة. يرجى التواصل مع الدعم إذا كنت تعتقد أن هذا خطأ.",
    );
  }

  if (!currentUser.isActive) {
    throw new UnauthorizedError("This account has been deactivated.");
  }

  if (currentUser.passwordChangedAt) {
    const changedTimestamp = parseInt(
      currentUser.passwordChangedAt.getTime() / 1000,
      10,
    );
    if (decoded.iat < changedTimestamp) {
      throw new UnauthorizedError(
        "User recently changed password. Please log in again.",
      );
    }
  }

  // ✅ تحقق من تأكيد البريد — المستخدمون القدامى (emailVerified: true) يكملون عادي
  if (!currentUser.emailVerified) {
    throw new UnauthorizedError("يرجى تأكيد بريدك الإلكتروني أولاً");
  }

  req.user = currentUser;
  next();
});

// restrictTo - Role-based access control
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new ForbiddenError(
        "You do not have permission to perform this action.",
      );
    }
    next();
  };
};

module.exports = { protect, restrictTo, optionalAuth };
