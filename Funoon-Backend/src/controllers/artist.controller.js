// src/controllers/artist.controller.js
const mongoose = require("mongoose");
const User = require("../models/User");
const Artwork = require("../models/Artwork");
const ProfileView = require("../models/ProfileView");
const {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
} = require("../utils/api-error");
const ApiResponse = require("../utils/api-response");
const catchAsync = require("../utils/catch-async");
const { PLAN_CONFIG } = require("../models/User");
const Order = require("../models/Order");
const Wallet = require("../models/Wallet");
const ArtworkView = require("../models/ArtworkView");


// @desc    Get all artists (sorted by plan: Prestige > Plus > Classic)
// @route   GET /api/v1/artists
// @access  Public
const getAllArtists = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 12, search } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const query = {
    role: "artist",
    "subscription.isActive": true,
    isActive: { $ne: false },
  };

  if (search && search.trim()) {
    const searchRegex = new RegExp(search.trim(), "i");
    query.$or = [{ name: searchRegex }, { "address.city": searchRegex }];
  }

  const artists = await User.find(query)
    .select("name avatar bio address.city subscription.plan avgRating reviewsCount createdAt")
    .sort({
      "subscription.plan": -1,
      createdAt: -1,
    })
    .skip(skip)
    .limit(Number(limit));

  const total = await User.countDocuments(query);

  // ═══════════════════════════════════════════════════
  // ✅ إضافة معلومات الباقة + Badge + التقييمات
  // ═══════════════════════════════════════════════════
  const artistsWithPlan = artists.map((artist) => {
    const planConfig = PLAN_CONFIG[artist.subscription.plan];
    const isVerified = planConfig?.features?.verifiedBadge || false;

    return {
      _id: artist._id,
      name: artist.name,
      avatar: artist.avatar,
      bio: artist.bio,
      city: artist.address?.city,
      avgRating: artist.avgRating || 0,
      reviewsCount: artist.reviewsCount || 0,
      plan: {
        id: artist.subscription.plan,
        label: planConfig?.label || "Free",
        labelAr: planConfig?.labelAr || "مجاني",
      },
      isVerified,
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

  if (!mongoose.Types.ObjectId.isValid(artistId)) {
    throw new BadRequestError("Invalid artist ID");
  }

  const artist = await User.findById(artistId).select(
    "name avatar bio address.city role subscription createdAt profileViewsCount coverImage socialLinks avgRating reviewsCount +isActive",
  );

  if (!artist || artist.role !== "artist" || artist.isActive === false) {
    throw new NotFoundError("Artist not found");
  }

  // ✅ حساب زيارة للبروفايل
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

  if (result.lastErrorObject && !result.lastErrorObject.updatedExisting) {
    await User.findByIdAndUpdate(artistId, { $inc: { profileViewsCount: 1 } });
    artist.profileViewsCount = (artist.profileViewsCount || 0) + 1;
  }

  const artworks = await Artwork.find({
    artist: artistId,
    isActive: true,
    approvalStatus: "APPROVED",
  })
    .select(
      "title coverImage price images dimensions shippingType isSold createdAt",
    )
    .sort({ isSold: 1, createdAt: -1 });

  const planConfig = PLAN_CONFIG[artist.subscription.plan];

  // ═══════════════════════════════════════════════════
  // ✅ Custom Profile + Badge
  // ═══════════════════════════════════════════════════
  const isVerified = planConfig?.features?.verifiedBadge || false;

  return ApiResponse.success(
    res,
    {
      _id: artist._id,
      name: artist.name,
      avatar: artist.avatar,
      bio: artist.bio,
      city: artist.address?.city,
      profileViewsCount: artist.profileViewsCount || 0,
      avgRating: artist.avgRating || 0,
      reviewsCount: artist.reviewsCount || 0,
      memberSince: artist.createdAt,

      // ✅ Custom Profile
      coverImage: artist.coverImage || null,
      socialLinks: artist.socialLinks || {},

      // ✅ Badge
      isVerified,

      plan: {
        id: artist.subscription.plan,
        label: planConfig?.label || "Free",
        labelAr: planConfig?.labelAr || "مجاني",
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
  // ✅ من الـ config — مش hardcoded
  if (!req.user.hasFeature("analytics")) {
    throw new BadRequestError(
      "الإحصائيات التفصيلية متاحة فقط في باقتي أوبال بلس وأوبال برستيج. يرجى ترقية اشتراكك.",
    );
  }

  const { days = 30 } = req.query;
  const daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - Number(days));

  const views = await ProfileView.find({
    profile: req.user._id,
    viewedAt: { $gte: daysAgo },
  })
    .populate("user", "name avatar")
    .sort({ viewedAt: -1 })
    .limit(1000);

  const totalViews = views.length;
  const uniqueUsers = new Set(
    views.filter((v) => v.user).map((v) => v.user._id.toString()),
  ).size;
  const anonymousViews = views.filter((v) => !v.user).length;

  return ApiResponse.success(
    res,
    {
      totalProfileViews: req.user.profileViewsCount || 0,
      analytics: {
        periodDays: Number(days),
        totalViews,
        uniqueUsers,
        anonymousViews,
      },
      recentViews: views,
    },
    "Profile view analytics retrieved",
  );
});

// @desc    Get dashboard stats for artist
// @route   GET /api/v1/artists/dashboard/stats
// @access  Private (Artist)
const getDashboardStats = catchAsync(async (req, res, next) => {
  const artistId = req.user._id;

  // ─── Sales Stats ───
  const salesStats = await Order.aggregate([
    {
      $match: {
        artist: artistId,
        status: {
          $in: ["PAID", "PROCESSING", "SHIPPED", "DELIVERED", "COMPLETED"],
        },
      },
    },
    {
      $group: {
        _id: null,
        totalSales: { $sum: "$financials.totalAmount" }, // حجم المبيعات الكلي
        totalEarnings: { $sum: "$financials.totalArtistEarning" }, // ✅ أرباح الفنان الفعلية
        totalCommission: { $sum: "$financials.totalCommission" }, // عمولة الموقع
        totalShipping: { $sum: "$financials.shippingCost" }, // تكلفة الشحن
        totalOrders: { $sum: 1 },
      },
    },
  ]);

  // ─── Active Orders ───
  const activeOrders = await Order.countDocuments({
    artist: artistId,
    status: { $in: ["PAID", "PROCESSING", "SHIPPED"] },
  });

  // ─── Wallet ───
  const wallet = await Wallet.findOne({ user: artistId });

  // ─── Artworks Stats ───
  const artworkStats = await Artwork.aggregate([
    { $match: { artist: artistId } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        active: { $sum: { $cond: ["$isActive", 1, 0] } },
        sold: { $sum: { $cond: ["$isSold", 1, 0] } },
      },
    },
  ]);

  // ─── Subscription ───
  const user = await User.findById(artistId).select("subscription");

  // ─── Recent Orders ───
  const recentOrders = await Order.find({
    artist: artistId,
    // status: { $ne: "PENDING_PAYMENT" },
    status: { $nin: ["PENDING_PAYMENT", "CANCELLED"] },
  })
    .sort({ createdAt: -1 })
    .limit(100)
    .populate("items.artwork", "title coverImage price")
    .populate("buyer", "name");

  return ApiResponse.success(
    res,
    {
      sales: {
        totalSales: salesStats[0]?.totalSales || 0, // حجم المبيعات
        totalEarnings: salesStats[0]?.totalEarnings || 0, // ✅ أرباح الفنان
        totalCommission: salesStats[0]?.totalCommission || 0, // عمولة الموقع
        totalShipping: salesStats[0]?.totalShipping || 0, // الشحن
        totalOrders: salesStats[0]?.totalOrders || 0,
        activeOrders,
      },
      wallet: {
        available: wallet?.balance?.available || 0,
        pending: wallet?.balance?.pending || 0,
      },
      artworks: {
        total: artworkStats[0]?.total || 0,
        active: artworkStats[0]?.active || 0,
        sold: artworkStats[0]?.sold || 0,
      },
      subscription: {
        plan: user?.subscription?.plan || "none",
        label: PLAN_CONFIG[user?.subscription?.plan]?.label || "No Plan",
        endDate: user?.subscription?.endDate,
        isActive: user?.hasActiveSubscription?.() || false,
      },
      recentOrders,
    },
    "Dashboard stats retrieved",
  );
});

// @desc    Get artist's incoming orders
// @route   GET /api/v1/artists/orders
// @access  Private (Artist)
const getArtistOrders = catchAsync(async (req, res, next) => {
  const { status, page = 1, limit = 10 } = req.query;
  const artistId = req.user._id;

  const query = {
    artist: artistId,
    status: { $ne: "PENDING_PAYMENT" },
  };
  if (status) query.status = status;

  const skip = (Number(page) - 1) * Number(limit);

  // ✅ لو محتاج شحن (PAID) → الأقدم الأول (FIFO)، غير كده الأحدث الأول
  const sortOrder = status === "PAID" ? { createdAt: 1 } : { createdAt: -1 };

  const orders = await Order.find(query)
    .sort(sortOrder)
    .skip(skip)
    .limit(Number(limit))
    .populate("items.artwork", "title coverImage price dimensions")
    .populate("buyer", "name email phone address");

  const total = await Order.countDocuments(query);

  return ApiResponse.success(
    res,
    {
      orders,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
      },
    },
    "Artist orders retrieved",
  );
});

// @desc    Get detailed analytics per artwork (Plus/Prestige only)
// @route   GET /api/v1/artists/my/artworks-analytics
// @access  Private (Artist only)
const getMyArtworksAnalytics = catchAsync(async (req, res, next) => {
  if (!req.user.hasFeature("analytics")) {
    throw new ForbiddenError(
      "الإحصائيات التفصيلية متاحة فقط في باقتي أوبال بلس وأوبال برستيج.",
    );
  }

  const artistId = req.user._id;
  const periodDays = Math.min(90, Math.max(1, Number(req.query.days) || 30));
  const daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - periodDays);

  const artworks = await Artwork.find({ artist: artistId }).select(
    "title coverImage price viewsCount favoritesCount isSold isActive createdAt",
  );

  const empty = {
    periodDays,
    summary: {
      totalViews: 0,
      periodViews: 0,
      totalFavorites: 0,
      totalOrders: 0,
      totalRevenue: 0,
      totalEarnings: 0,
    },
    dailyViews: [],
    artworks: [],
    topByViews: [],
    topByFavorites: [],
    topByOrders: [],
  };

  if (!artworks.length) {
    return ApiResponse.success(res, empty, "No artworks yet");
  }

  const artworkIds = artworks.map((a) => a._id);

  // ─── 1. طلبات + إيرادات (من financials) ───
  const orderStats = await Order.aggregate([
    {
      $match: {
        artist: artistId,
        status: {
          $in: ["PAID", "PROCESSING", "SHIPPED", "DELIVERED", "COMPLETED"],
        },
      },
    },
    { $unwind: "$items" },
    { $match: { "items.artwork": { $in: artworkIds } } },
    {
      $group: {
        _id: "$items.artwork",
        orderCount: { $sum: 1 },
        totalRevenue: { $sum: "$financials.totalAmount" },
        artistEarning: { $sum: "$financials.totalArtistEarning" },
      },
    },
  ]);

  const orderMap = new Map(orderStats.map((s) => [s._id.toString(), s]));

  // ─── 2. مشاهدات من ArtworkView (raw) — للفترة المحددة ───
  const periodViewsAgg = await ArtworkView.aggregate([
    {
      $match: {
        artwork: { $in: artworkIds },
        viewedAt: { $gte: daysAgo },
      },
    },
    {
      $group: {
        _id: "$artwork",
        periodCount: { $sum: 1 },
      },
    },
  ]);
  const periodViewsMap = new Map(
    periodViewsAgg.map((v) => [v._id.toString(), v.periodCount]),
  );

  // ─── 3. مشاهدات يومية (للـ graph) ───
  const rawDaily = await ArtworkView.aggregate([
    {
      $match: {
        artwork: { $in: artworkIds },
        viewedAt: { $gte: daysAgo },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$viewedAt" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const dailyMap = new Map(rawDaily.map((d) => [d._id, d.count]));
  const dailyViews = [];
  for (let i = periodDays - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    dailyViews.push({ date: key, count: dailyMap.get(key) || 0 });
  }
  const periodViews = dailyViews.reduce((s, d) => s + d.count, 0);

  // ─── 4. دمج البيانات ───
  const artworksWithStats = artworks.map((artwork) => {
    const s = orderMap.get(artwork._id.toString());
    const orders = s?.orderCount || 0;
    const revenue = s?.totalRevenue || 0;
    const earnings = s?.artistEarning || 0;
    const periodCount = periodViewsMap.get(artwork._id.toString()) || 0;

    return {
      _id: artwork._id,
      title: artwork.title,
      coverImage: artwork.coverImage,
      price: artwork.price,
      isSold: artwork.isSold,
      isActive: artwork.isActive,
      allTimeViews: artwork.viewsCount || 0, // إجمالي دائم
      periodViews: periodCount, // في الفترة المحددة
      favorites: artwork.favoritesCount || 0,
      orders,
      revenue,
      earnings,
      conversionRate: periodCount
        ? parseFloat(((orders / periodCount) * 100).toFixed(2))
        : 0,
    };
  });

  // ─── 5. Summary ───
  const summary = artworksWithStats.reduce(
    (acc, a) => ({
      totalViews: acc.totalViews + a.allTimeViews,
      totalFavorites: acc.totalFavorites + a.favorites,
      totalOrders: acc.totalOrders + a.orders,
      totalRevenue: acc.totalRevenue + a.revenue,
      totalEarnings: acc.totalEarnings + a.earnings,
    }),
    {
      totalViews: 0,
      totalFavorites: 0,
      totalOrders: 0,
      totalRevenue: 0,
      totalEarnings: 0,
    },
  );
  summary.periodViews = periodViews;

  const sortBy = (key) =>
    [...artworksWithStats].sort((a, b) => b[key] - a[key]).slice(0, 5);

  return ApiResponse.success(
    res,
    {
      periodDays,
      summary,
      dailyViews,
      artworks: artworksWithStats,
      topByViews: sortBy("periodViews"),
      topByFavorites: sortBy("favorites"),
      topByOrders: sortBy("orders"),
    },
    "Artworks analytics retrieved",
  );
});

module.exports = {
  getAllArtists,
  getArtistPublicProfile,
  getMyProfileViews,
  getDashboardStats,
  getArtistOrders,
  getMyArtworksAnalytics,
};
