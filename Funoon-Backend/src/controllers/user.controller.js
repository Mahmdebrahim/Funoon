const User = require("../models/User");
const FileUploadService = require("../services/file-upload.service");
const {
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
} = require("../utils/api-error");
const ApiResponse = require("../utils/api-response");
const catchAsync = require("../utils/catch-async");


// 1. Get Current User Profile
const getProfile = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new NotFoundError("User profile not found");
  }
  return ApiResponse.success(
    res,
    user,
    "Profile details retrieved successfully",
  );
});

// 2. Update Profile
const updateProfile = catchAsync(async (req, res, next) => {
  const { name, phone, bio, address } = req.body;

  const updates = {};
  if (name !== undefined) updates.name = name;
  if (phone !== undefined) updates.phone = phone;

  // Only artists can update bio
  if (req.user.role === "artist" && bio !== undefined) {
    updates.bio = bio;
  }

  // Address updates (merge with existing)
  if (address) {
    updates.address = {
      ...req.user.address,
      ...address,
      country: address.country || req.user.address.country || "SA",
    };
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { $set: updates },
    { new: true, runValidators: true },
  );

  return ApiResponse.success(res, updatedUser, "Profile updated successfully");
});

// 3. Upload Avatar
const uploadAvatar = catchAsync(async (req, res, next) => {
  if (!req.file) {
    throw new BadRequestError("Please provide an image file for the avatar.");
  }

  const avatarUrl = await FileUploadService.uploadAvatar(
    req.file,
    req.user._id,
  );

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { avatar: avatarUrl } },
    { new: true },
  );

  return ApiResponse.success(res, updatedUser, "Avatar uploaded successfully");
});

// 4. Change Password  NEW
const changePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  // 1. Get user with password field
  const user = await User.findById(req.user._id).select("+password");
  if (!user) {
    throw new NotFoundError("User not found");
  }

  // 2. Verify current password
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw new UnauthorizedError("Current password is incorrect");
  }

  // 3. Update password (pre-save hook will hash it)
  user.password = newPassword;
  user.passwordChangedAt = Date.now();
  await user.save();

  // 4. Revoke all refresh tokens (security best practice)
  const RefreshToken = require("../models/RefreshToken");
  await RefreshToken.deleteMany({ user: user._id });

  return ApiResponse.success(
    res,
    null,
    "Password changed successfully. Please login again.",
  );
});

// 5. Get Public Profile (for artists - visible to buyers) NEW
const getPublicProfile = catchAsync(async (req, res, next) => {
  const { userId } = req.params;

  const user = await User.findById(userId).select(
    "name avatar bio role address createdAt",
  );

  if (!user) {
    throw new NotFoundError("User not found");
  }

  // Only return public info
  const publicProfile = {
    _id: user._id,
    name: user.name,
    avatar: user.avatar,
    bio: user.bio,
    role: user.role,
    city: user.address?.city,
    memberSince: user.createdAt,
  };

  return ApiResponse.success(res, publicProfile, "Public profile retrieved");
});

// 6. Update Bank Details (for artists - withdrawal) NEW
const updateBankDetails = catchAsync(async (req, res, next) => {
  // Only artists can update bank details
  if (req.user.role !== "artist") {
    throw new BadRequestError("Only artists can update bank details");
  }

  const { iban, bankName, accountHolder } = req.body;

  if (!iban || !bankName || !accountHolder) {
    throw new BadRequestError(
      "IBAN, bank name, and account holder are required",
    );
  }

  // Validate Saudi IBAN format (SA + 22 digits)
  if (!/^SA\d{22}$/.test(iban.replace(/\s/g, ""))) {
    throw new BadRequestError(
      "Invalid Saudi IBAN format. Must be SA + 22 digits",
    );
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        "bankDetails.iban": iban.replace(/\s/g, ""),
        "bankDetails.bankName": bankName,
        "bankDetails.accountHolder": accountHolder,
      },
    },
    { new: true },
  );

  return ApiResponse.success(
    res,
    updatedUser.bankDetails,
    "Bank details updated successfully",
  );
});

// 7. Delete Account (Soft Delete)  NEW
const deleteAccount = catchAsync(async (req, res, next) => {
  const { password } = req.body;

  // Verify password
  const user = await User.findById(req.user._id).select("+password");
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new UnauthorizedError("Password is incorrect");
  }

  // Soft delete
  user.isActive = false;
  user.deletedAt = new Date();
  await user.save();

  // Revoke all refresh tokens
  const RefreshToken = require("../models/RefreshToken");
  await RefreshToken.deleteMany({ user: user._id });

  return ApiResponse.success(res, null, "Account deleted successfully");
});

// src/controllers/user.controller.js

// @desc    Update user address
// @route   PUT /api/v1/users/address
// @access  Private

const updateAddress = catchAsync(async (req, res, next) => {
  
  const { 
    street, 
    city, 
    district, 
    zipCode, 
    country,
    buildingNo,
    shortAddressCode,
    lat,
    lon
  } = req.body;

  // التحقق من وجود حقل واحد على الأقل
  if (!street && !city && !district) {
    throw new BadRequestError(
      "At least one address field (street, city, or district) is required"
    );
  }

  // ✅ نجيب الـ user كامل من الـ database
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new NotFoundError("User not found");
  }

  // ✅ نبني الـ address object (لو مش موجود، نبدأ بـ object فاضي)
  const currentAddress = user.address || {};
  
  const updatedAddress = {
    ...currentAddress,  // ✅ نحتفظ بالقيم الموجودة
    country: currentAddress.country || "SA",  // ✅ default value
  };

  // ✅ نحدث فقط الحقول اللي اتبعتت
  if (street !== undefined) updatedAddress.street = street;
  if (city !== undefined) updatedAddress.city = city;
  if (district !== undefined) updatedAddress.district = district;
  if (zipCode !== undefined) updatedAddress.zipCode = zipCode;
  if (country !== undefined) updatedAddress.country = country;
  if (buildingNo !== undefined) updatedAddress.buildingNo = buildingNo;
  if (shortAddressCode !== undefined) updatedAddress.shortAddressCode = shortAddressCode;
  if (lat !== undefined) updatedAddress.lat = lat;
  if (lon !== undefined) updatedAddress.lon = lon;

  // ✅ نحدث الـ user
  user.address = updatedAddress;
  await user.save();

  return ApiResponse.success(
    res, 
    user.address, 
    "Address updated successfully"
  );
});

// 9. Get Address
const getAddress = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id).select("address");

  if (!user.address || Object.keys(user.address).length === 0) {
    return ApiResponse.success(
      res,
      null,
      "No address found. Please add your address.",
    );
  }

  return ApiResponse.success(res, user.address, "Address retrieved");
});

module.exports = {
  getProfile,
  updateProfile,
  uploadAvatar,
  changePassword,
  getPublicProfile,
  updateBankDetails,
  deleteAccount,
  updateAddress,
  getAddress,
};
