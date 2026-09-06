const User = require("../models/User");
const FileUploadService = require("../services/file-upload.service");
const {
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
} = require("../utils/api-error");
const ApiResponse = require("../utils/api-response");
const catchAsync = require("../utils/catch-async");
const OTOService = require("../services/shipping/oto.service");
const upload = require("../middlewares/upload.middleware"); // multer middleware

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
  const { name, phone, bio, address, coverImage, socialLinks } = req.body;

  const updates = {};
  if (name !== undefined) updates.name = name;
  if (phone !== undefined) updates.phone = phone;

  // Only artists can update bio
  if (req.user.role === "artist" && bio !== undefined) {
    updates.bio = bio;
  }

  // ═══════════════════════════════════════════════════
  // ✅ Custom Profile Features (Plus/Prestige only)
  // ═══════════════════════════════════════════════════
  if (req.user.role === "artist") {
    const planConfig = req.user.getPlanConfig();

    // coverImage (Plus + Prestige)
    if (coverImage !== undefined) {
      if (!planConfig?.features?.coverImage) {
        throw new BadRequestError(
          "صورة الغلاف متاحة فقط في باقتي أوبال بلس وأوبال برستيج.",
        );
      }
      updates.coverImage = coverImage;
    }

    // socialLinks (Plus + Prestige)
    if (socialLinks !== undefined) {
      if (!planConfig?.features?.socialLinks) {
        throw new BadRequestError(
          "الروابط الاجتماعية متاحة فقط في باقتي أوبال بلس وأوبال برستيج.",
        );
      }
      updates.socialLinks = {
        instagram: socialLinks.instagram || null,
        twitter: socialLinks.twitter || null,
        snapchat: socialLinks.snapchat || null,
        facebook: socialLinks.facebook || null,
        website: socialLinks.website || null,
      };
    }
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

  return ApiResponse.success(res, updatedUser, "تم تحديث البروفايل بنجاح");
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

// @desc    Upload cover image (Plus/Prestige only)
// @route   POST /api/v1/users/cover-image
// @access  Private (Artist only)
const uploadCoverImage = catchAsync(async (req, res, next) => {
  // 1. لازم يكون فنان
  if (req.user.role !== "artist") {
    throw new BadRequestError("صورة الغلاف متاحة للفنانين فقط.");
  }

  // 2. لازم يكون عنده باقة Plus أو Prestige
  const planConfig = req.user.getPlanConfig();
  if (!planConfig?.features?.coverImage) {
    throw new BadRequestError(
      "صورة الغلاف متاحة فقط في باقتي أوبال بلس وأوبال برستيج.",
    );
  }

  // 3. لازم يكون فيه ملف
  if (!req.file) {
    throw new BadRequestError("يرجى رفع صورة.");
  }

  // 4. رفع الصورة
  const coverUrl = await FileUploadService.uploadCoverImage(
    req.file,
    req.user._id,
  );

  // 5. حذف الصورة القديمة لو موجودة
  if (req.user.coverImage) {
    await FileUploadService.deleteFile(req.user.coverImage);
  }

  // 6. تحديث المستخدم
  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { coverImage: coverUrl } },
    { new: true },
  );

  return ApiResponse.success(
    res,
    { coverImage: coverUrl },
    "تم رفع صورة الغلاف بنجاح",
  );
});

// @desc    Delete cover image
// @route   DELETE /api/v1/users/cover-image
// @access  Private (Artist only)
const deleteCoverImage = catchAsync(async (req, res, next) => {
  if (req.user.role !== "artist") {
    throw new BadRequestError("صورة الغلاف متاحة للفنانين فقط.");
  }

  if (!req.user.coverImage) {
    throw new BadRequestError("لا توجد صورة غلاف لحذفها.");
  }

  await FileUploadService.deleteFile(req.user.coverImage);

  await User.findByIdAndUpdate(req.user._id, {
    $set: { coverImage: null },
  });

  return ApiResponse.success(res, null, "تم حذف صورة الغلاف");
});

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

// @desc    Lookup & save address from OTO short address code
// @route   POST /api/v1/users/address/lookup
// @access  Private
const lookupAddress = catchAsync(async (req, res, next) => {
  const { shortAddressCode } = req.body;

  // ─── Validation ───
  if (!shortAddressCode) {
    throw new BadRequestError("shortAddressCode is required");
  }

  const cleanedCode = shortAddressCode.trim().toUpperCase();
  if (!/^[A-Z0-9]{6,10}$/.test(cleanedCode)) {
    throw new BadRequestError(
      "Invalid short address code format. Expected 6-10 alphanumeric characters (e.g., RGUC8214).",
    );
  }

  // ─── Call OTO API ───
  let otoResponse;
  try {
    otoResponse = await OTOService.getAddressByShortCode(cleanedCode);
  } catch (error) {
    // OTO API error (code غلط أو service مش متاح)
    if (error.otoErrorCode) {
      throw new BadRequestError(
        error.otoErrorMessage || "Address not found. Please check the code and try again.",
      );
    }
    throw new Error("Address lookup service unavailable. Please try again later.");
  }

  const otoData = otoResponse?.data;
  if (!otoData) {
    throw new BadRequestError("Address not found. Please check the code and try again.");
  }

  // ─── Mapping: OTO → User Address ───
  const address = {
    city: otoData.cityName || otoData.city?.name || "",
    district: otoData.districtName || otoData.district?.name || "",
    street: otoData.streetName || "",
    buildingNo: otoData.buildingName || "",
    secondaryAddressNumber: otoData.secondary || "",
    zipCode: otoData.zipCode || "",
    shortAddressCode: otoData.shortAddressCode || cleanedCode,
    lat: otoData.lat || undefined,
    lon: otoData.lng || undefined,
    country: otoData.countryShortCode || "SA",
  };

  // ─── Save to User ───
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new NotFoundError("User not found");
  }

  user.address = {
    ...(user.address || {}),
    ...address,
  };
  await user.save();

  return ApiResponse.success(
    res,
    {
      address: user.address,
      formattedFullAddress: otoData.formattedFullAddress || null,
    },
    "Address verified and saved successfully",
  );
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
  lookupAddress,
  uploadCoverImage, 
  deleteCoverImage,
};
