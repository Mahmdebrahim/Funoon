const mongoose = require("mongoose");
const Artwork = require("../models/Artwork");
const User = require("../models/User");
const FileUploadService = require("../services/file-upload.service");
const {
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
  ForbiddenError,
} = require("../utils/api-error");
const ApiResponse = require("../utils/api-response");
const catchAsync = require("../utils/catch-async");
const eventEmitter = require("../events/event-emitter");
const EVENTS = require("../events/events");

const MAJOR_UPDATE_FIELDS = [
  "title",
  "description",
  "price",
  "category",
  "medium",
  "paintType",
  "images",
];

// @desc    Create artwork (requires admin approval)
// @route   POST /api/v1/artworks
const createArtwork = catchAsync(async (req, res, next) => {
  const user = req.user;

  if (user.isBanned) {
    throw new ForbiddenError("حسابك محظور — النشر غير متاح");
  }

  if (!user.hasActiveSubscription()) {
    throw new BadRequestError("يجب أن يكون لديك اشتراك نشط لنشر اللوحات.");
  }

  if (!req.files || req.files.length === 0) {
    throw new BadRequestError("يرجى رفع صورة واحدة على الأقل.");
  }

  const planConfig = user.getPlanConfig();

  // ═══ Dimensions validation ═══
  const { dimensions: rawDimensions } = req.body;
  const dimensions =
    typeof rawDimensions === "string"
      ? JSON.parse(rawDimensions)
      : rawDimensions;

  if (!dimensions || !dimensions.width || !dimensions.height) {
    throw new BadRequestError("أبعاد اللوحة (العرض والارتفاع) مطلوبة");
  }

  const maxDim = Math.max(
    Number(dimensions.width),
    Number(dimensions.height),
    Number(dimensions.depth || 0),
  );

  if (maxDim > planConfig.maxArtworkSize) {
    throw new BadRequestError(
      `أبعاد اللوحة (${Math.round(maxDim)} سم) تتجاوز الحد الأقصى لباقتك (${planConfig.maxArtworkSize} سم).`,
    );
  }

  const currentCount = await Artwork.countDocuments({
    artist: user._id,
    isSold: false,
    approvalStatus: { $in: ["APPROVED", "PENDING_APPROVAL"] },
  });

  if (currentCount >= planConfig.maxArtworks) {
    throw new BadRequestError(
      `لقد وصلت للحد الأقصى (${planConfig.maxArtworks}) من اللوحات في باقتك (${planConfig.labelAr}).`,
    );
  }

  // ═══ Upload images ═══
  const artworkId = new mongoose.Types.ObjectId();
  const uploadedImages = await Promise.all(
    req.files.map((file, index) =>
      FileUploadService.uploadArtworkImage(file, artworkId, index),
    ),
  );

  const {
    title,
    description,
    price,
    weight,
    category,
    medium,
    paintType,
    canvasThickness,
    dimensionType,
    tags,
  } = req.body;

  const artwork = new Artwork({
    _id: artworkId,
    title,
    description,
    price,
    images: uploadedImages.map((img, index) => ({
      url: img.url,
      key: img.key,
      order: index,
    })),
    artist: user._id,
    dimensions,
    weight: Number(weight),
    category,
    medium: medium || paintType,
    paintType: paintType || null,
    canvasThickness: canvasThickness || null,
    dimensionType: dimensionType || "2D",
    tags: typeof tags === "string" ? JSON.parse(tags) : tags,
    listedUnderPlan: user.subscription.plan,
    approvalStatus: "PENDING_APPROVAL",
    isActive: false,
  });

  await artwork.save();

  eventEmitter.safeEmit(EVENTS.ARTWORK_SUBMITTED, {
    artistId: user._id,
    artistName: user.name,
    artworkId: artwork._id,
    title: artwork.title,
  });

  return ApiResponse.created(
    res,
    artwork,
    "تم استلام لوحتك بنجاح وهي الآن قيد المراجعة من فريق المنصة. سيتم إشعارك فور الموافقة عليها.",
  );
});

// @desc    Update artwork (Owner only)
// @route   PUT /api/v1/artworks/:id
const updateArtwork = catchAsync(async (req, res, next) => {
  if (req.user.isBanned) {
    throw new ForbiddenError("حسابك محظور — التعديل غير متاح");
  }

  const artwork = await Artwork.findById(req.params.id).populate("artist", "name");
  if (!artwork) throw new NotFoundError("Artwork not found");

  if (artwork.artist._id.toString() !== req.user._id.toString()) {
    throw new UnauthorizedError("You are not authorized to update this artwork")
  }

  const {
    title, description, price, dimensions, weight, category,
    medium, paintType, canvasThickness, dimensionType, tags,
    existingImageKeys,
  } = req.body;

  // ═══ Track major changes for re-approval ═══
  let hasMajorChange = false;

  if (title !== undefined && title !== artwork.title) hasMajorChange = true;
  if (description !== undefined && description !== artwork.description) hasMajorChange = true;
  if (price !== undefined && Number(price) !== artwork.price) hasMajorChange = true;
  if (category !== undefined && category !== artwork.category) hasMajorChange = true;
  if (paintType !== undefined && paintType !== artwork.paintType) hasMajorChange = true;
  if (medium !== undefined && medium !== artwork.medium) hasMajorChange = true;
  if (req.files && req.files.length > 0) hasMajorChange = true;

  // Apply all fields
  if (title !== undefined) artwork.title = title;
  if (description !== undefined) artwork.description = description;
  if (price !== undefined) artwork.price = price;
  if (weight !== undefined) artwork.weight = Number(weight);
  if (category !== undefined) artwork.category = category;
  if (paintType !== undefined) {
    artwork.paintType = paintType;
    artwork.medium = paintType;
  } else if (medium !== undefined) {
    artwork.medium = medium;
    if (!artwork.paintType) artwork.paintType = medium;
  }
  if (canvasThickness !== undefined) artwork.canvasThickness = canvasThickness;
  if (dimensionType !== undefined) artwork.dimensionType = dimensionType;
  if (dimensions !== undefined) {
    artwork.dimensions =
      typeof dimensions === "string" ? JSON.parse(dimensions) : dimensions;
  }
  if (tags !== undefined) {
    artwork.tags = typeof tags === "string" ? JSON.parse(tags) : tags;
  }

  // ═══ Images: selective keep + append new ═══
  const hasExistingKeys = existingImageKeys !== undefined;
  const keepArr = hasExistingKeys
    ? typeof existingImageKeys === "string"
      ? JSON.parse(existingImageKeys)
      : existingImageKeys
    : null;

  let finalImages = artwork.images.map((img) => ({
    url: img.url,
    key: img.key,
    order: img.order,
  }));

  if (keepArr !== null) {
    const keepSet = new Set(keepArr);
    const toDelete = finalImages.filter((img) => !keepSet.has(img.key));

    await Promise.all(
      toDelete.map((img) =>
        FileUploadService.deleteImageByKey
          ? FileUploadService.deleteImageByKey(img.key).catch((err) => {
              console.warn(`⚠️ Failed to delete image ${img.key}:`, err.message);
            })
          : Promise.resolve(),
      ),
    );

    finalImages = keepArr
      .map((key) => finalImages.find((img) => img.key === key))
      .filter(Boolean);
  }

  if (req.files && req.files.length > 0) {
    const startOrder = finalImages.length;
    const uploadedImages = await Promise.all(
      req.files.map((file, index) =>
        FileUploadService.uploadArtworkImage(
          file,
          artwork._id,
          startOrder + index,
        ),
      ),
    );
    finalImages = [
      ...finalImages,
      ...uploadedImages.map((img, index) => ({
        url: img.url,
        key: img.key,
        order: startOrder + index,
      })),
    ];
  }

  if (finalImages.length === 0) {
    throw new BadRequestError("Artwork must have at least one image");
  }

  artwork.images = finalImages;

  // ═══ Re-approval logic ═══
  if (hasMajorChange && artwork.approvalStatus === "APPROVED") {
    artwork.approvalStatus = "PENDING_APPROVAL";
    artwork.isActive = false;
    artwork.reviewedBy = null;
    artwork.reviewedAt = null;
    artwork.adminNote = null;
    eventEmitter.safeEmit(EVENTS.ARTWORK_UPDATED_NEEDS_REVIEW, {
      artistId: artwork.artist._id,
      artworkId: artwork._id,
      artworkTitle: artwork.title,
      artistName: artwork.artist.name,
    });

  }

  // لو كانت REJECTED وعدّلها الفنان → ترجع للمراجعة تلقائياً
  if (artwork.approvalStatus === "REJECTED") {
    artwork.approvalStatus = "PENDING_APPROVAL";
    artwork.adminNote = null;
    artwork.reviewedBy = null;
    artwork.reviewedAt = null;
    eventEmitter.safeEmit(EVENTS.ARTWORK_UPDATED_NEEDS_REVIEW, {
      artistId: artwork.artist._id,
      artworkId: artwork._id,
      artworkTitle: artwork.title,
      artistName: artwork.artist.name,
    });
  }

  await artwork.save();

  const message = hasMajorChange && artwork.approvalStatus === "PENDING_APPROVAL"
    ? "تم تحديث اللوحة بنجاح. التعديلات الجوهرية تتطلب مراجعة جديدة من فريق المنصة."
    : "تم تحديث اللوحة بنجاح";

  return ApiResponse.success(res, artwork, message);
});

// @desc    Delete artwork (Owner or Admin)
// @route   DELETE /api/v1/artworks/:id
const deleteArtwork = catchAsync(async (req, res, next) => {
  if (req.user.isBanned) {
    throw new ForbiddenError("حسابك محظور — الحذف غير متاح");
  }

  const artwork = await Artwork.findById(req.params.id);
  if (!artwork) throw new NotFoundError("Artwork not found");

  const isOwner = artwork.artist.toString() === req.user._id.toString();
  const isAdmin = req.user.role === "admin";

  if (!isOwner && !isAdmin) {
    throw new UnauthorizedError("You are not authorized to delete this artwork");
  }

  // ✅ Guard: لو عليها طلبات → منع الحذف
  const ordersCount = await Order.countDocuments({
    "items.artwork": artwork._id,
  });

  if (ordersCount > 0 && !isAdmin) {
    throw new BadRequestError(
      "لا يمكن حذف لوحة مباعة للحفاظ على سجل طلباتك. يمكنك إخفاؤها من البروفايل بدلاً من ذلك.",
    );
  }

  // Admin hard-delete bypasses the orders check (but should use soft delete instead)
  if (ordersCount > 0 && isAdmin) {
    // Soft delete only
    artwork.isActive = false;
    artwork.approvalStatus = "SUSPENDED";
    artwork.adminNote = "تم الإيقاف بواسطة الأدمن (لها طلبات مرتبطة — حذف مرفوض)";
    await artwork.save();

    return ApiResponse.success(
      res,
      { deactivated: true, ordersCount },
      "تم إيقاف اللوحة — لا يمكن حذف لوحة لها طلبات مرتبطة",
    );
  }

  await FileUploadService.deleteArtworkImages(artwork._id);
  await Artwork.findByIdAndDelete(artwork._id);

  return ApiResponse.success(res, null, "Artwork deleted successfully");
});

// @desc    Toggle active status (Owner only, requires APPROVED)
// @route   PATCH /api/v1/artworks/:id/toggle
const toggleActiveStatus = catchAsync(async (req, res, next) => {
  if (req.user.isBanned) {
    throw new ForbiddenError("حسابك محظور — التعديل غير متاح");
  }

  const artwork = await Artwork.findById(req.params.id);
  if (!artwork) throw new NotFoundError("Artwork not found");

  if (artwork.artist.toString() !== req.user._id.toString()) {
    throw new UnauthorizedError("You are not authorized to toggle this artwork");
  }

  // ═══ ✅ APPROVED فقط هو اللي الفنان يقدر يتحكم فيه ═══
  if (artwork.approvalStatus !== "APPROVED") {
    const statusMessages = {
      PENDING_APPROVAL: "لوحتك قيد المراجعة من فريق المنصة. يرجى الانتظار.",
      REJECTED: `تم رفض اللوحة. ${artwork.adminNote ? `السبب: ${artwork.adminNote}` : ""}`,
      SUSPENDED: `تم إيقاف اللوحة بواسطة فريق المنصة. ${artwork.adminNote ? `السبب: ${artwork.adminNote}` : ""}`,
    };

    throw new BadRequestError(
      statusMessages[artwork.approvalStatus] ||
        "لا يمكنك تفعيل/إيقاف هذه اللوحة في حالتها الحالية.",
    );
  }

  artwork.isActive = !artwork.isActive;
  await artwork.save();

  return ApiResponse.success(
    res,
    artwork,
    artwork.isActive ? "تم تفعيل اللوحة" : "تم إيقاف اللوحة",
  );
});

// Get single artwork details (with optional view counter)
// const getArtworkDetails = catchAsync(async (req, res, next) => {
//   const artworkId = req.params.id;
//   const userId = req.user?._id;
//   const ipAddress =
//     req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
//     req.ip ||
//     req.connection?.remoteAddress;

//   const expiresAt = new Date();
//   expiresAt.setHours(expiresAt.getHours() + 24);

//   // Query
//   const viewQuery = userId
//     ? { artwork: artworkId, user: userId, expiresAt: { $gt: new Date() } }
//     : { artwork: artworkId, ipAddress, expiresAt: { $gt: new Date() } };

//   // Atomic operation
//   const result = await ArtworkView.findOneAndUpdate(
//     viewQuery,
//     {
//       $set: {
//         artwork: artworkId,
//         user: userId || null,
//         ipAddress: userId ? null : ipAddress,
//         viewedAt: new Date(),
//         expiresAt,
//       },
//     },
//     {
//       upsert: true,
//       new: true,
//       includeResultMetadata: true,
//     },
//   );

//   if (result.lastErrorObject && !result.lastErrorObject.updatedExisting) {
//     await Artwork.findByIdAndUpdate(artworkId, { $inc: { viewsCount: 1 } });
//   }

//   const artwork = await Artwork.findById(artworkId).populate(
//     "artist",
//     "name avatar email",
//   );

//   if (!artwork) throw new NotFoundError("Artwork not found");
//   return ApiResponse.success(res, artwork, "Artwork details retrieved");
// });

//-------
const getArtworkDetails = catchAsync(async (req, res, next) => {
  const artworkId = req.params.id;
  const userId = req.user?._id;

  // ═══════════════════════════════════════════════════
  // Get artwork with populated data
  // ═══════════════════════════════════════════════════
  const pipeline = [
    { $match: { _id: new mongoose.Types.ObjectId(artworkId) } },
    {
      $lookup: {
        from: "users",
        localField: "artist",
        foreignField: "_id",
        as: "artist",
      },
    },
    { $unwind: "$artist" },
  ];

  // Add isFavorite flag if user is logged in
  if (userId) {
    pipeline.push(
      {
        $lookup: {
          from: "favorites",
          let: { artworkId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$artwork", "$$artworkId"] },
                    { $eq: ["$user", userId] },
                  ],
                },
              },
            },
          ],
          as: "favoriteData",
        },
      },
      {
        $addFields: {
          isFavorite: { $gt: [{ $size: "$favoriteData" }, 0] },
        },
      },
      { $project: { favoriteData: 0 } },
    );
  }

  const results = await Artwork.aggregate(pipeline);

  if (!results[0]) {
    throw new NotFoundError("Artwork not found");
  }

  if (results[0].artist?.isBanned) {
    throw new NotFoundError("Artwork not found");
  }

  // ═══════════════════════════════════════════════════
  // View Counter (unique per user/IP per 24h)
  // ═══════════════════════════════════════════════════
  // Note: ArtworkView model لازم يكون موجود
  try {
    const ArtworkView = require("../models/ArtworkView");
    const ipAddress =
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.ip ||
      req.connection?.remoteAddress;

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const viewQuery = userId
      ? { artwork: artworkId, user: userId, expiresAt: { $gt: new Date() } }
      : { artwork: artworkId, ipAddress, expiresAt: { $gt: new Date() } };

    const result = await ArtworkView.findOneAndUpdate(
      viewQuery,
      {
        $set: {
          artwork: artworkId,
          user: userId || null,
          ipAddress: userId ? null : ipAddress,
          viewedAt: new Date(),
          expiresAt,
        },
      },
      { upsert: true, new: true, includeResultMetadata: true },
    );

    if (result.lastErrorObject && !result.lastErrorObject.updatedExisting) {
      await Artwork.findByIdAndUpdate(artworkId, { $inc: { viewsCount: 1 } });
    }
  } catch (error) {
    // لو ArtworkView مش موجود، تجاهل الخطأ
    console.warn("ArtworkView tracking failed:", error.message);
  }

  // ═══════════════════════════════════════════════════
  // Get related artworks (same category/artist)
  // ═══════════════════════════════════════════════════
  const relatedArtworks = await Artwork.find({
    _id: { $ne: artworkId },
    isActive: true,
    approvalStatus: "APPROVED",
    isSold: false,
    $or: [{ category: results[0].category }, { artist: results[0].artist._id }],
  })
    .select("title coverImage price artist dimensions isSold")
    .populate("artist", "name avatar isVerified")
    .limit(4)
    .lean();

  return ApiResponse.success(
    res,
    {
      artwork: results[0],
      relatedArtworks,
    },
    "Artwork details retrieved",
  );
});

// List all artworks with filters, pagination & sorting
const listAllArtworks = catchAsync(async (req, res, next) => {
  const {
    category,
    medium,
    paintType,
    canvasThickness,
    dimensionType,
    minPrice,
    maxPrice,
    size,
    search,
    tags,
    subscriptionPlan,
    minRating,
    sort = "priority",
  } = req.query;

  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 12));
  const skip = (page - 1) * limit;

  const userId = req.user?._id;

  // ═══════════════════════════════════════════════════
  // Build Query
  // ═══════════════════════════════════════════════════
  const query = { isActive: true, approvalStatus: "APPROVED", isSold: false };

  if (category) {
    const categories = Array.isArray(category) ? category : category.split(",");
    query.category = { $in: categories };
  }

  if (paintType || medium) {
    const pTypes = Array.isArray(paintType || medium)
      ? paintType || medium
      : (paintType || medium).split(",");
    query.$or = query.$or || [];
    query.$or.push({ paintType: { $in: pTypes } }, { medium: { $in: pTypes } });
  }

  if (canvasThickness) {
    const thicknesses = Array.isArray(canvasThickness)
      ? canvasThickness
      : canvasThickness.split(",");
    query.canvasThickness = { $in: thicknesses };
  }

  if (dimensionType) {
    const dims = Array.isArray(dimensionType)
      ? dimensionType
      : dimensionType.split(",");
    query.dimensionType = { $in: dims };
  }

  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }

  if (size) {
    const sizes = Array.isArray(size) ? size : [size];
    const sizeConditions = [];
    sizes.forEach((s) => {
      switch (s.toLowerCase()) {
        case "small":
          sizeConditions.push({
            $or: [
              { "dimensions.width": { $lt: 30 } },
              { "dimensions.height": { $lt: 30 } },
            ],
          });
          break;
        case "medium":
          sizeConditions.push({
            $or: [
              { "dimensions.width": { $gte: 30, $lt: 60 } },
              { "dimensions.height": { $gte: 30, $lt: 60 } },
            ],
          });
          break;
        case "large":
          sizeConditions.push({
            $or: [
              { "dimensions.width": { $gte: 60, $lt: 100 } },
              { "dimensions.height": { $gte: 60, $lt: 100 } },
            ],
          });
          break;
        case "giant":
          sizeConditions.push({
            $or: [
              { "dimensions.width": { $gte: 100 } },
              { "dimensions.height": { $gte: 100 } },
            ],
          });
          break;
      }
    });
    if (sizeConditions.length > 0) {
      query.$and = query.$and || [];
      query.$and.push({ $or: sizeConditions });
    }
  }

  if (tags) {
    const tagArray = Array.isArray(tags)
      ? tags
      : tags.split(",").map((t) => t.trim().toLowerCase());
    query.tags = { $in: tagArray };
  }

  if (search) {
    query.$or = query.$or || [];
    query.$or.push(
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { medium: { $regex: search, $options: "i" } },
      { paintType: { $regex: search, $options: "i" } },
      { category: { $regex: search, $options: "i" } },
      { canvasThickness: { $regex: search, $options: "i" } },
      { tags: { $regex: search, $options: "i" } },
    );
  }

  // ═══════════════════════════════════════════════════
  // ✅ Build priority branches dynamically from PLAN_CONFIG
  // ═══════════════════════════════════════════════════
  const priorityBranches = Object.entries(User.PLAN_CONFIG || {}).map(
    ([planId, cfg]) => ({
      case: { $eq: ["$artist.subscription.plan", planId] },
      then: cfg.searchPriority || 1,
    }),
  );

  const pipeline = [
    { $match: query },
    {
      $lookup: {
        from: "users",
        localField: "artist",
        foreignField: "_id",
        as: "artist",
      },
    },
    { $unwind: { path: "$artist", preserveNullAndEmptyArrays: true } },
    { $match: { "artist.isBanned": { $ne: true } } },

    // ✅ priority from config (مش hardcoded)
    {
      $addFields: {
        subscriptionPriority: {
          $switch: {
            branches: priorityBranches,
            default: 1,
          },
        },
      },
    },
  ];

  if (subscriptionPlan) {
    const plans = Array.isArray(subscriptionPlan)
      ? subscriptionPlan
      : subscriptionPlan.split(",");
    pipeline.push({
      $match: {
        "artist.subscription.plan": { $in: plans },
      },
    });
  }

  // ═══ Rating filter: filter by artist's avgRating ═══
  if (minRating) {
    const minRatingNum = parseFloat(minRating);
    if (!isNaN(minRatingNum) && minRatingNum >= 1 && minRatingNum <= 5) {
      pipeline.push({
        $match: {
          "artist.avgRating": { $gte: minRatingNum },
        },
      });
    }
  }

  let sortStage = {};
  switch (sort) {
    case "priority":
      sortStage = { subscriptionPriority: -1, createdAt: -1 };
      break;
    case "newest":
      sortStage = { createdAt: -1 };
      break;
    case "price_asc":
      sortStage = { subscriptionPriority: -1, price: 1 };
      break;
    case "price_desc":
      sortStage = { subscriptionPriority: -1, price: -1 };
      break;
    case "popular":
      sortStage = {
        subscriptionPriority: -1,
        favoritesCount: -1,
        viewsCount: -1,
      };
      break;
    default:
      sortStage = { subscriptionPriority: -1, createdAt: -1 };
  }

  pipeline.push({ $sort: sortStage });

  const countPipeline = [...pipeline];
  countPipeline.push({ $count: "total" });
  const countResult = await Artwork.aggregate(countPipeline);
  const total = countResult[0]?.total || 0;

  pipeline.push({ $skip: skip }, { $limit: limit });

  if (userId) {
    pipeline.push({
      $lookup: {
        from: "favorites",
        let: { artworkId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$artwork", "$$artworkId"] },
                  { $eq: ["$user", userId] },
                ],
              },
            },
          },
        ],
        as: "favoriteData",
      },
    });
    pipeline.push({
      $addFields: { isFavorite: { $gt: [{ $size: "$favoriteData" }, 0] } },
    });
  } else {
    pipeline.push({ $addFields: { isFavorite: false } });
  }

  // ✅ Project + إرجاع badge + coverImage للفنان
  pipeline.push({
    $project: {
      favoriteData: 0,
      "artist.password": 0,
      "artist.address.buildingNo": 0,
      "artist.address.street": 0,
    },
  });

  const artworks = await Artwork.aggregate(pipeline);

  const finalArtworks = artworks.map((a) => {
    const planConfig = User.PLAN_CONFIG?.[a.artist?.subscription?.plan];
    return {
      ...a,
      coverImage: a.images?.[0]?.url || a.coverImage || null,
      // ✅ بيانات إضافية للفنان (badge + cover)
      artist: a.artist
        ? {
            ...a.artist,
            isVerified: planConfig?.features?.verifiedBadge || false,
            coverImage: a.artist.coverImage || null,
          }
        : null,
    };
  });

  return ApiResponse.success(
    res,
    {
      artworks: finalArtworks,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
        hasNext: skip + limit < total,
        hasPrev: page > 1,
      },
    },
    "Artworks retrieved",
  );
});

// @desc    Get my artworks (artist only)
// @route   GET /api/v1/artworks/my
// @access  Private (Artist)
const getMyArtworks = catchAsync(async (req, res, next) => {
  const { status, isSold, page = 1, limit = 12 } = req.query;
  const artistId = req.user._id;

  const filter = { artist: artistId };
  if (status === "active") {
    filter.isActive = true;
    filter.isSold = false;
    filter.approvalStatus = "APPROVED";
  } else if (status === "inactive") {
    filter.isActive = false;
    // filter.isSold = false;
    filter.approvalStatus = "APPROVED";
  } else if (status === "pending") {
    filter.approvalStatus = "PENDING_APPROVAL";
  } else if (status === "rejected") {
    filter.approvalStatus = "REJECTED";
  } else if (status === "suspended") {
    filter.approvalStatus = "SUSPENDED";
  } else if (isSold === "true") {
    filter.isSold = true;
  }
  // if (status === "active") query.isActive = true;
  // if (status === "inactive") query.isActive = false;
  // if (isSold === "true") query.isSold = true;
  // if (isSold === "false") query.isSold = false;

  const skip = (Number(page) - 1) * Number(limit);

  const artworks = await Artwork.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  const total = await Artwork.countDocuments(filter);

  return ApiResponse.success(
    res,
    {
      artworks,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
      },
    },
    "My artworks retrieved",
  );
});

// Get available filter options (categories, mediums, cities, price ranges, etc.)
const getFilterOptions = catchAsync(async (req, res, next) => {
  // Categories
  const categories = await Artwork.distinct("category", {
    isActive: true,
    isSold: false,
  });

  // Mediums & Paint Types
  const paintTypesResult = await Artwork.distinct("paintType", {
    isActive: true,
    isSold: false,
  });
  const mediumsResult = await Artwork.distinct("medium", {
    isActive: true,
    isSold: false,
  });
  const paintTypes = Array.from(
    new Set([...paintTypesResult, ...mediumsResult]),
  )
    .filter(Boolean)
    .sort();

  // Canvas Thicknesses
  const canvasThicknesses = await Artwork.distinct("canvasThickness", {
    isActive: true,
    isSold: false,
  });

  // Dimension Types
  const dimensionTypes = await Artwork.distinct("dimensionType", {
    isActive: true,
    isSold: false,
  });

  // Cities (from artists' addresses)
  const citiesResult = await Artwork.aggregate([
    { $match: { isActive: true, isSold: false } },
    {
      $lookup: {
        from: "users",
        localField: "artist",
        foreignField: "_id",
        as: "artist",
      },
    },
    { $unwind: "$artist" },
    { $group: { _id: "$artist.address.city" } },
    { $match: { _id: { $ne: null } } },
  ]);
  const cities = citiesResult.map((c) => c._id);

  // Price range (min & max)
  const priceStats = await Artwork.aggregate([
    { $match: { isActive: true, isSold: false } },
    {
      $group: {
        _id: null,
        min: { $min: "$price" },
        max: { $max: "$price" },
      },
    },
  ]);

  const priceRange = priceStats[0] || { min: 0, max: 10000 };

  // Size distribution (pre-calculated)
  const sizeStats = await Artwork.aggregate([
    { $match: { isActive: true, isSold: false } },
    {
      $addFields: {
        maxDimension: {
          $max: ["$dimensions.width", "$dimensions.height"],
        },
      },
    },
    {
      $bucket: {
        groupBy: "$maxDimension",
        boundaries: [0, 30, 60, 100, Number.MAX_SAFE_INTEGER],
        default: "Other",
        output: {
          count: { $sum: 1 },
        },
      },
    },
  ]);

  const sizeDistribution = {
    small: sizeStats.find((s) => s._id === 0)?.count || 0,
    medium: sizeStats.find((s) => s._id === 30)?.count || 0,
    large: sizeStats.find((s) => s._id === 60)?.count || 0,
    giant: sizeStats.find((s) => s._id === 100)?.count || 0,
  };

  return ApiResponse.success(
    res,
    {
      categories: categories.filter(Boolean).sort(),
      mediums: paintTypes,
      paintTypes: paintTypes,
      canvasThicknesses: canvasThicknesses.filter(Boolean).sort(),
      dimensionTypes: dimensionTypes.filter(Boolean).sort(),
      cities: cities.filter(Boolean).sort(),
      priceRange: {
        min: Math.floor(priceRange.min),
        max: Math.ceil(priceRange.max),
      },
      sizeDistribution,
      totalCount: await Artwork.countDocuments({
        isActive: true,
        isSold: false,
      }),
    },
    "Filter options retrieved",
  );
});

// ─── Featured Artworks ────────────────────────────────────────────────────────

// @desc    Feature an artwork (artist Prestige only)
// @route   PATCH /api/v1/artworks/:id/feature
// @access  Private (Artist)
const featureArtwork = catchAsync(async (req, res, next) => {
  const user = req.user;

  // ═══ 1. تحقق من الباقة ═══
  const isPrestige =
    user.subscription?.plan === "opal_prestige" &&
    user.hasActiveSubscription();

  if (!isPrestige) {
    throw new ForbiddenError(
      "ميزة التمييز متاحة فقط للفنانين المشتركين في باقة Opal Prestige النشطة. " +
        "قم بترقية اشتراكك من صفحة الاشتراكات للاستفادة من هذه الميزة.",
    );
  }

  // ═══ 2. جلب اللوحة والتحقق من الملكية والشروط ═══
  const artwork = await Artwork.findById(req.params.id);
  if (!artwork) throw new NotFoundError("اللوحة غير موجودة");

  if (artwork.artist.toString() !== user._id.toString()) {
    throw new ForbiddenError("لا يحق لك تمييز لوحة لا تملكها");
  }

  if (artwork.approvalStatus !== "APPROVED") {
    throw new BadRequestError("يمكن تمييز اللوحات المعتمدة فقط");
  }
  if (!artwork.isActive) {
    throw new BadRequestError("يمكن تمييز اللوحات النشطة فقط");
  }
  if (artwork.isSold) {
    throw new BadRequestError("لا يمكن تمييز لوحة مباعة");
  }

  // ═══ 3. إلغاء تمييز اللوحة القديمة (إن وجدت) ═══
  const previousFeatured = await Artwork.findOneAndUpdate(
    { artist: user._id, isFeatured: true, _id: { $ne: artwork._id } },
    { $set: { isFeatured: false, featuredAt: null } },
    { new: false },
  );

  // ═══ 4. تمييز اللوحة الجديدة ═══
  artwork.isFeatured = true;
  artwork.featuredAt = new Date();
  await artwork.save();

  const message = previousFeatured
    ? `تم تمييز اللوحة بنجاح. تم إلغاء تمييز لوحتك السابقة "${previousFeatured.title}" تلقائياً.`
    : "تم تمييز اللوحة بنجاح ✨";

  return ApiResponse.success(
    res,
    {
      artwork: { _id: artwork._id, isFeatured: true, featuredAt: artwork.featuredAt },
      previousUnfeatured: previousFeatured
        ? { _id: previousFeatured._id, title: previousFeatured.title }
        : null,
    },
    message,
  );
});

// @desc    Unfeature an artwork
// @route   PATCH /api/v1/artworks/:id/unfeature
// @access  Private (Artist owner or Admin)
const unfeatureArtwork = catchAsync(async (req, res, next) => {
  const artwork = await Artwork.findById(req.params.id);
  if (!artwork) throw new NotFoundError("اللوحة غير موجودة");

  const isOwner = artwork.artist.toString() === req.user._id.toString();
  const isAdmin = req.user.role === "admin";

  if (!isOwner && !isAdmin) {
    throw new ForbiddenError("لا يحق لك إلغاء تمييز هذه اللوحة");
  }

  artwork.isFeatured = false;
  artwork.featuredAt = null;
  await artwork.save();

  return ApiResponse.success(res, null, "تم إلغاء تمييز اللوحة بنجاح");
});

// @desc    Get all featured artworks (public)
// @route   GET /api/v1/artworks/featured
// @access  Public
const getFeaturedArtworks = catchAsync(async (req, res, next) => {
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const skip = (page - 1) * limit;

  // ═══ 1. جلب اللوحات المميزة من الـ DB ═══
  const baseQuery = {
    isFeatured: true,
    isActive: true,
    isSold: false,
    approvalStatus: "APPROVED",
  };

  const artworks = await Artwork.find(baseQuery)
    .sort({ featuredAt: -1 })
    .populate(
      "artist",
      "name avatar subscription isBanned avgRating reviewsCount",
    )
    .lean();

  // ═══ 2. فلتر التحقق من صحة الفنان (prestige نشط + غير محظور) ═══
  const validArtworks = artworks.filter((a) => {
    const artist = a.artist;
    if (!artist || artist.isBanned) return false;
    if (artist.subscription?.plan !== "opal_prestige") return false;
    if (!artist.subscription?.isActive) return false;
    const endDate = artist.subscription?.endDate;
    if (!endDate || new Date(endDate) <= new Date()) return false;
    return true;
  });

  // ═══ 3. Pagination يدوي بعد الفلتر ═══
  const total = validArtworks.length;
  const paginated = validArtworks.slice(skip, skip + limit);

  // ═══ 4. إضافة coverImage + isVerified ═══
  const finalArtworks = paginated.map((a) => ({
    ...a,
    coverImage: a.images?.[0]?.url || a.coverImage || null,
    artist: a.artist
      ? {
          ...a.artist,
          isVerified: true, // prestige دايماً verified
        }
      : null,
  }));

  return ApiResponse.success(
    res,
    {
      artworks: finalArtworks,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
        hasNext: skip + limit < total,
        hasPrev: page > 1,
      },
    },
    "اللوحات المميزة",
  );
});

// @desc    Get platform stats (counts)
// @route   GET /api/v1/artworks/stats
// @access  Public
const getPlatformStats = catchAsync(async (req, res, next) => {
  const [artistCount, artworkCount, salesCount, reviewCount] =
    await Promise.all([
      User.countDocuments({ role: "artist", isBanned: { $ne: true } }),
      Artwork.countDocuments({ isActive: true, approvalStatus: "APPROVED" }),
      Artwork.countDocuments({ isSold: true }),
      (async () => {
        try {
          const Review = require("../models/Review");
          return await Review.countDocuments({ isHidden: { $ne: true } });
        } catch {
          return 0;
        }
      })(),
    ]);

  return ApiResponse.success(
    res,
    { artistCount, artworkCount, salesCount, reviewCount },
    "إحصائيات المنصة",
  );
});

module.exports = {
  createArtwork,
  updateArtwork,
  deleteArtwork,
  toggleActiveStatus,
  getArtworkDetails,
  listAllArtworks,
  getFilterOptions,
  getMyArtworks,
  featureArtwork,
  unfeatureArtwork,
  getFeaturedArtworks,
  getPlatformStats,
};

