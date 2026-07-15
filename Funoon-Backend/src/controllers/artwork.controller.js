const mongoose = require("mongoose");
const Artwork = require("../models/Artwork");
const FileUploadService = require("../services/file-upload.service");
const {
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
} = require("../utils/api-error");
const ApiResponse = require("../utils/api-response");
const catchAsync = require("../utils/catch-async");

// Create new artwork (Artist only)
const createArtwork = catchAsync(async (req, res, next) => {
  const user = req.user;

  if (!user.hasActiveSubscription()) {
    throw new BadRequestError(
      "You must have an active subscription to list artwork.",
    );
  }

  const planConfig = user.getPlanConfig();
  const currentCount = await Artwork.countDocuments({
    artist: user._id,
    isActive: true,
  });

  // if (currentCount >= planConfig.maxArtworks) {
  //   throw new BadRequestError(
  //     `You reached the limit (${planConfig.maxArtworks}) for your plan.`,
  //   );
  // }

  if (!req.files || req.files.length === 0) {
    throw new BadRequestError("Please upload at least one image.");
  }

  const artworkId = new mongoose.Types.ObjectId();

  // Upload images
  const uploadedImages = await Promise.all(
    req.files.map((file, index) =>
      FileUploadService.uploadArtworkImage(file, artworkId, index),
    ),
  );

  const {
    title,
    description,
    price,
    dimensions,
    weight,
    category,
    medium,
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
    dimensions:
      typeof dimensions === "string" ? JSON.parse(dimensions) : dimensions,
    weight: Number(weight),
    category,
    medium,
    tags: typeof tags === "string" ? JSON.parse(tags) : tags,
    listedUnderPlan: user.subscription.plan,
  });

  await artwork.save();
  return ApiResponse.created(res, artwork, "Artwork listed successfully");
});

// Update artwork (Owner only)
const updateArtwork = catchAsync(async (req, res, next) => {
  const artwork = await Artwork.findById(req.params.id);
  if (!artwork) throw new NotFoundError("Artwork not found");

  if (artwork.artist.toString() !== req.user._id.toString()) {
    throw new UnauthorizedError(
      "You are not authorized to update this artwork",
    );
  }

  const {
    title,
    description,
    price,
    dimensions,
    weight,
    category,
    medium,
    tags,
  } = req.body;

  if (title !== undefined) artwork.title = title;
  if (description !== undefined) artwork.description = description;
  if (price !== undefined) artwork.price = price;
  if (weight !== undefined) artwork.weight = Number(weight);
  if (category !== undefined) artwork.category = category;
  if (medium !== undefined) artwork.medium = medium;
  if (dimensions !== undefined) {
    artwork.dimensions =
      typeof dimensions === "string" ? JSON.parse(dimensions) : dimensions;
  }
  if (tags !== undefined) {
    artwork.tags = typeof tags === "string" ? JSON.parse(tags) : tags;
  }

  // Replace images if new ones uploaded
  if (req.files && req.files.length > 0) {
    await FileUploadService.deleteArtworkImages(artwork._id);
    const uploadedImages = await Promise.all(
      req.files.map((file, index) =>
        FileUploadService.uploadArtworkImage(file, artwork._id, index),
      ),
    );
    artwork.images = uploadedImages.map((img, index) => ({
      url: img.url,
      key: img.key,
      order: index,
    }));
  }

  await artwork.save();
  return ApiResponse.success(res, artwork, "Artwork updated successfully");
});

// Delete artwork permanently (Owner or Admin)
const deleteArtwork = catchAsync(async (req, res, next) => {
  const artwork = await Artwork.findById(req.params.id);
  if (!artwork) throw new NotFoundError("Artwork not found");

  if (
    artwork.artist.toString() !== req.user._id.toString() &&
    req.user.role !== "admin"
  ) {
    throw new UnauthorizedError(
      "You are not authorized to delete this artwork",
    );
  }

  await FileUploadService.deleteArtworkImages(artwork._id);
  await Artwork.findByIdAndDelete(artwork._id);
  return ApiResponse.success(res, null, "Artwork deleted successfully");
});

// Toggle artwork active/inactive status
const toggleActiveStatus = catchAsync(async (req, res, next) => {
  const artwork = await Artwork.findById(req.params.id);
  if (!artwork) throw new NotFoundError("Artwork not found");

  if (artwork.artist.toString() !== req.user._id.toString()) {
    throw new UnauthorizedError(
      "You are not authorized to toggle this artwork",
    );
  }

  artwork.isActive = !artwork.isActive;
  await artwork.save();
  return ApiResponse.success(
    res,
    artwork,
    `Artwork ${artwork.isActive ? "activated" : "deactivated"}`,
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
  const artwork = await Artwork.findById(req.params.id).populate(
    "artist",
    "name avatar email"
  );

  if (!artwork) throw new NotFoundError("Artwork not found");
  return ApiResponse.success(res, artwork, "Artwork details retrieved");
});

// List all artworks with filters, pagination & sorting
const listAllArtworks = catchAsync(async (req, res, next) => {
  
  const {
    category,
    minPrice,
    maxPrice,
    search,
    artist,
    tags,
    sort,
    page = 1,
    limit = 10,
  } = req.query;

  const query = { isActive: true, isSold: false };

  if (category) query.category = category;
  if (artist) query.artist = artist;
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }
  if (tags) {
    const tagArray = Array.isArray(tags)
      ? tags
      : tags.split(",").map((t) => t.trim().toLowerCase());
    query.tags = { $in: tagArray };
  }
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { medium: { $regex: search, $options: "i" } },
    ];
  }

  // Sorting
  let sortOption = { createdAt: -1 };
  if (sort === "price_asc") sortOption = { price: 1 };
  else if (sort === "price_desc") sortOption = { price: -1 };
  // else if (sort === "popular") sortOption = { viewsCount: -1 };

  const skip = (Number(page) - 1) * Number(limit);
  const artworks = await Artwork.find(query)
    .populate("artist", "name avatar")
    .sort(sortOption)
    .skip(skip)
    .limit(Number(limit));

  const total = await Artwork.countDocuments(query);

  return ApiResponse.success(
    res,
    {
      artworks,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        limit: Number(limit),
      },
    },
    "Artworks retrieved",
  );
});

module.exports = {
  createArtwork,
  updateArtwork,
  deleteArtwork,
  toggleActiveStatus,
  getArtworkDetails,
  listAllArtworks,
};
