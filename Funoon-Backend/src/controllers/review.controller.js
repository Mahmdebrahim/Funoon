const mongoose = require("mongoose");
const Review = require("../models/Review");
const Order = require("../models/Order");
const User = require("../models/User");
const {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
  UnauthorizedError,
} = require("../utils/api-error");
const ApiResponse = require("../utils/api-response");
const catchAsync = require("../utils/catch-async");

// @desc    Create a review for a completed order
// @route   POST /api/v1/reviews
// @access  Private (Buyer)
const createReview = catchAsync(async (req, res, next) => {
  const { orderId, rating, comment } = req.body;

  if (!orderId) {
    throw new BadRequestError("رقم الطلب مطلوب");
  }

  if (!rating || Number(rating) < 1 || Number(rating) > 5) {
    throw new BadRequestError("التقييم يجب أن يكون بين 1 و 5 نجوم");
  }

  // Check comment length if provided
  const trimmedComment = comment ? comment.trim() : "";
  if (trimmedComment.length > 0 && trimmedComment.length < 3) {
    throw new BadRequestError("التعليق يجب أن يكون 3 حروف على الأقل عند كتابته");
  }
  if (trimmedComment.length > 500) {
    throw new BadRequestError("التعليق لا يمكن أن يتجاوز 500 حرف");
  }

  // Find order
  const order = await Order.findById(orderId);
  if (!order) {
    throw new NotFoundError("الطلب غير موجود");
  }

  // Verify ownership (Buyer of the order)
  if (order.buyer.toString() !== req.user._id.toString()) {
    throw new ForbiddenError("غير مصرح لك بتقديم تقييم لهذا الطلب");
  }

  // Verify order status is COMPLETED
  if (order.status !== "COMPLETED") {
    throw new BadRequestError("التقييم متاح فقط للطلبات المكتملة");
  }

  // Check 30-day timeframe from completedAt
  const completedDate = order.completedAt || order.updatedAt;
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  if (Date.now() - new Date(completedDate).getTime() > thirtyDaysMs) {
    throw new BadRequestError("انتهت مهلة التقييم (30 يوماً من تاريخ إكمال الطلب)");
  }

  // Check duplicate review for this order
  const existingReview = await Review.findOne({ order: orderId });
  if (existingReview) {
    throw new BadRequestError("لقد قمت بتقييم هذا الطلب من قبل");
  }

  const artworkId = order.items?.[0]?.artwork || null;

  const review = await Review.create({
    reviewer: req.user._id,
    reviewedArtist: order.artist,
    order: orderId,
    artwork: artworkId,
    rating: Number(rating),
    comment: trimmedComment || null,
    isVerifiedPurchase: true,
  });

  return ApiResponse.created(res, review, "تم إضافة تقييمك بنجاح");
});

// @desc    Get public artist reviews with summary & distribution
// @desc    Get public artist reviews with summary & distribution
// @route   GET /api/v1/artists/:artistId/reviews
// @access  Public (Admin can see hidden reviews)
const getArtistReviews = catchAsync(async (req, res, next) => {
  const { artistId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(artistId)) {
    throw new BadRequestError("معرف الفنان غير صحيح");
  }

  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
  const skip = (page - 1) * limit;

  const isAdmin = req.user && req.user.role === "admin";
  const filter = {
    reviewedArtist: artistId,
  };
  if (!isAdmin) {
    filter.isHidden = false;
  }

  const total = await Review.countDocuments(filter);

  const reviews = await Review.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("reviewer", "name avatar")
    .populate("artwork", "title coverImage");

  // Summary & Star Distribution calculation (for non-hidden reviews ONLY)
  const starStats = await Review.aggregate([
    {
      $match: {
        reviewedArtist: new mongoose.Types.ObjectId(artistId),
        isHidden: false,
      },
    },
    {
      $group: {
        _id: "$rating",
        count: { $sum: 1 },
      },
    },
  ]);

  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let sumRatings = 0;
  let totalRatingsCount = 0;

  starStats.forEach((item) => {
    if (distribution[item._id] !== undefined) {
      distribution[item._id] = item.count;
      sumRatings += item._id * item.count;
      totalRatingsCount += item.count;
    }
  });

  const avgRating =
    totalRatingsCount > 0
      ? Math.round((sumRatings / totalRatingsCount) * 10) / 10
      : 0;

  return ApiResponse.success(
    res,
    {
      reviews,
      summary: {
        avgRating,
        total: totalRatingsCount,
        distribution,
      },
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit) || 1,
      },
    },
    "تم جلب التقييمات بنجاح"
  );
});

// @desc    Get my reviews (Buyer)
// @route   GET /api/v1/reviews/my
// @access  Private (Buyer)
const getMyReviews = catchAsync(async (req, res, next) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
  const skip = (page - 1) * limit;

  const filter = { reviewer: req.user._id };

  const total = await Review.countDocuments(filter);
  const reviews = await Review.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("reviewedArtist", "name avatar")
    .populate("artwork", "title coverImage")
    .populate("order", "_id createdAt status completedAt");

  return ApiResponse.success(
    res,
    {
      reviews,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit) || 1,
      },
    },
    "تم جلب تقييماتك بنجاح"
  );
});

// @desc    Update a review (Owner only, within 7 days)
// @route   PUT /api/v1/reviews/:id
// @access  Private (Buyer / Owner)
const updateReview = catchAsync(async (req, res, next) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    throw new NotFoundError("التقييم غير موجود");
  }

  // Check ownership
  if (review.reviewer.toString() !== req.user._id.toString()) {
    throw new UnauthorizedError("غير مصرح لك بتعديل هذا التقييم");
  }

  // Check 7-day edit window
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  if (Date.now() - new Date(review.createdAt).getTime() > sevenDaysMs) {
    throw new BadRequestError("انتهت مهلة تعديل التقييم (7 أيام من تاريخ الإنشاء)");
  }

  const { rating, comment } = req.body;

  if (rating !== undefined) {
    if (Number(rating) < 1 || Number(rating) > 5) {
      throw new BadRequestError("التقييم يجب أن يكون بين 1 و 5 نجوم");
    }
    review.rating = Number(rating);
  }

  if (comment !== undefined) {
    const trimmed = comment ? comment.trim() : "";
    if (trimmed.length > 0 && trimmed.length < 3) {
      throw new BadRequestError("التعليق يجب أن يكون 3 حروف على الأقل عند كتابته");
    }
    if (trimmed.length > 500) {
      throw new BadRequestError("التعليق لا يمكن أن يتجاوز 500 حرف");
    }
    review.comment = trimmed || null;
  }

  await review.save(); // Triggers post save hook for recalculating artist stats

  return ApiResponse.success(res, review, "تم تعديل التقييم بنجاح");
});

// @desc    Hide a review (Admin only)
// @route   PATCH /api/v1/reviews/:id/hide
// @access  Private (Admin)
const hideReview = catchAsync(async (req, res, next) => {
  const { reason } = req.body;

  if (!reason || !reason.trim()) {
    throw new BadRequestError("سبب الإخفاء إجباري");
  }

  if (reason.trim().length < 10) {
    throw new BadRequestError("سبب الإخفاء يجب أن يكون 10 حروف على الأقل");
  }

  const review = await Review.findById(req.params.id);

  if (!review) {
    throw new NotFoundError("التقييم غير موجود");
  }

  review.isHidden = true;
  review.hiddenBy = req.user._id;
  review.hiddenAt = new Date();
  review.hiddenReason = reason.trim();

  await review.save(); // Triggers post save hook to recalculate stats excluding hidden review

  return ApiResponse.success(res, review, "تم إخفاء التقييم بنجاح");
});

// @desc    Unhide a review (Admin only)
// @route   PATCH /api/v1/reviews/:id/unhide
// @access  Private (Admin)
const unhideReview = catchAsync(async (req, res, next) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    throw new NotFoundError("التقييم غير موجود");
  }

  review.isHidden = false;
  review.hiddenBy = null;
  review.hiddenAt = null;
  review.hiddenReason = null;

  await review.save(); // Triggers post save hook to recalculate stats including unhidden review

  return ApiResponse.success(res, review, "تم إظهار التقييم بنجاح");
});

// @desc    Get recent top public reviews
// @route   GET /api/v1/reviews/recent
// @access  Public
const getRecentReviews = catchAsync(async (req, res, next) => {
  const limit = Math.min(10, Math.max(1, parseInt(req.query.limit) || 6));
  const reviews = await Review.find({ isHidden: false, rating: { $gte: 4 } })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("reviewer", "name avatar")
    .populate("reviewedArtist", "name avatar")
    .populate("artwork", "title coverImage");

  return ApiResponse.success(res, reviews, "التقييمات الأخيرة");
});

module.exports = {
  createReview,
  getArtistReviews,
  getMyReviews,
  getRecentReviews,
  updateReview,
  hideReview,
  unhideReview,
};

