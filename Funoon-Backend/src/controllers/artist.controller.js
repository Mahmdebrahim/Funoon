// src/controllers/artist.controller.js
const mongoose = require("mongoose");
const User = require("../models/User");
const Artwork = require("../models/Artwork");
const ProfileView = require("../models/ProfileView");
const { BadRequestError, NotFoundError } = require("../utils/api-error");
const ApiResponse = require("../utils/api-response");
const catchAsync = require("../utils/catch-async");
const { PLAN_CONFIG } = require("../models/User");

// @desc    Get all artists (sorted by plan: Prestige > Plus > Classic)
// @route   GET /api/v1/artists
// @access  Public
const getAllArtists = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  // ✅ ترتيب حسب الباقة (Prestige > Plus > Classic > none)
  // باستخدام ترتيب عكسي أبجدي (desc) على الـ string:
  // "opal_prestige" > "opal_plus" > "opal_classic" > "none"
  const artists = await User.find({
    role: "artist",
    "subscription.isActive": true,
    isActive: { $ne: false },
  })
    .select(
      "name avatar bio address.city subscription.plan createdAt",
    )
    .sort({
      "subscription.plan": -1,
      createdAt: -1,
    })
    .skip(skip)
    .limit(Number(limit));

  const total = await User.countDocuments({
    role: "artist",
    "subscription.isActive": true,
    isActive: { $ne: false },
  });

  // إضافة معلومات الباقة
  const artistsWithPlan = artists.map((artist) => {
    const planConfig = PLAN_CONFIG[artist.subscription.plan];
    return {
      _id: artist._id,
      name: artist.name,
      avatar: artist.avatar,
      bio: artist.bio,
      city: artist.address?.city,
      plan: {
        id: artist.subscription.plan,
        label: planConfig?.label || "Free",
      },
      memberSince: artist.createdAt,
    };
  });

  return ApiResponse.success(
    res,
    {
      artists: artistsWithPlan,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        limit: Number(limit),
      },
    },
    "Artists retrieved successfully",
  );
});

// @desc    Get artist public profile + all their artworks
// @route   GET /api/v1/artists/:artistId
// @access  Public
const getArtistPublicProfile = catchAsync(async (req, res, next) => {
  const { artistId } = req.params;

  // التحقق إن الـ ID صحيح
  if (!mongoose.Types.ObjectId.isValid(artistId)) {
    throw new BadRequestError("Invalid artist ID");
  }

  const artist = await User.findById(artistId).select(
    "name avatar bio address.city role subscription createdAt profileViewsCount +isActive",
  );

  if (!artist || artist.role !== "artist" || artist.isActive === false) {
    throw new NotFoundError("Artist n0000000ot found");
  }

  // ✅ حساب زيارة للبروفايل (بنفس طريقة الـ ArtworkView القديم)
  const userId = req.user?._id;
  const ipAddress =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.ip ||
    req.connection?.remoteAddress;

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);

  const viewQuery = userId
    ? { profile: artistId, user: userId, expiresAt: { $gt: new Date() } }
    : { profile: artistId, ipAddress, expiresAt: { $gt: new Date() } };

  const result = await ProfileView.findOneAndUpdate(
    viewQuery,
    {
      $set: {
        profile: artistId,
        user: userId || null,
        ipAddress: userId ? null : ipAddress,
        viewedAt: new Date(),
        expiresAt,
      },
    },
    { upsert: true, new: true, includeResultMetadata: true },
  );

  // لو زيارة جديدة (مش update)، زود الـ counter
  if (result.lastErrorObject && !result.lastErrorObject.updatedExisting) {
    await User.findByIdAndUpdate(artistId, { $inc: { profileViewsCount: 1 } });
    artist.profileViewsCount = (artist.profileViewsCount || 0) + 1;
  }

  // جلب لوحات الفنان (النشطة فقط)
  const artworks = await Artwork.find({
    artist: artistId,
    isActive: true,
  })
    .select("title coverImage price images dimensions shippingType createdAt")
    .sort({ createdAt: -1 });

  const planConfig = PLAN_CONFIG[artist.subscription.plan];

  return ApiResponse.success(
    res,
    {
      _id: artist._id,
      name: artist.name,
      avatar: artist.avatar,
      bio: artist.bio,
      city: artist.address?.city,
    //   profileViewsCount: artist.profileViewsCount,
      memberSince: artist.createdAt,
      plan: {
        id: artist.subscription.plan,
        label: planConfig?.label || "Free",
      },
      artworks: {
        total: artworks.length,
        items: artworks,
      },
    },
    "Artist profile retrieved",
  );
});

// @desc    Get my profile views analytics (Artist only - Plus/Prestige)
// @route   GET /api/v1/artists/my/profile-views
// @access  Private (Artist only)
const getMyProfileViews = catchAsync(async (req, res, next) => {
  const allowedPlans = ["opal_plus", "opal_prestige"];
  const userPlan = req.user.subscription?.plan;

  if (!userPlan || !allowedPlans.includes(userPlan)) {
    throw new BadRequestError(
      "Detailed profile view analytics are only available for Opal Plus and Opal Prestige plans. Please upgrade your subscription."
    );
  }

  const fullUser = await User.findById(req.user._id);
  if (!fullUser) {
    throw new NotFoundError("User not found");
  }

  const { days = 30 } = req.query;
  const daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - Number(days));

  // جلب المشاهدات التفصيلية
  const views = await ProfileView.find({
    profile: req.user._id,
    viewedAt: { $gte: daysAgo },
  })
    .populate("user", "name avatar")
    .sort({ viewedAt: -1 })
    .limit(1000);

  const totalViews = views.length;
  const uniqueUsers = new Set(
    views.filter((v) => v.user).map((v) => v.user._id.toString())
  ).size;
  const anonymousViews = views.filter((v) => !v.user).length;

  return ApiResponse.success(
    res,
    {
      totalProfileViews: fullUser.profileViewsCount || 0,
      analytics: {
        periodDays: Number(days),
        totalViews,
        uniqueUsers,
        anonymousViews,
      },
      recentViews: views,
    },
    "Profile view analytics retrieved"
  );
});

module.exports = {
  getAllArtists,
  getArtistPublicProfile,
  getMyProfileViews,
};
