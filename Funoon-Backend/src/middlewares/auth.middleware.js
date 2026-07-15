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

      if (currentUser && currentUser.isActive) {
        req.user = currentUser;
      }
    } catch (err) {
      // Token invalid - نتجاهل ونكمل (مش هنرمي error)
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
    throw new UnauthorizedError(
      "The user belonging to this token no longer exists.",
    );
  }

  // Check if user is active
  if (!currentUser.isActive) {
    throw new UnauthorizedError("This account has been deactivated.");
  }

  // Check if user changed password after the token was issued
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

  // Grant access
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
