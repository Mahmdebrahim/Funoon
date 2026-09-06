// src/routes/artist.routes.js
const express = require("express");
const router = express.Router();

const {
  getAllArtists,
  getArtistPublicProfile,
  getMyProfileViews,
  getDashboardStats,
  getArtistOrders,
  getMyArtworksAnalytics,
} = require("../controllers/artist.controller");
const { protect, restrictTo, optionalAuth } = require("../middlewares/auth.middleware");

const { getArtistReviews } = require("../controllers/review.controller");

// Public routes
router.get("/", getAllArtists); // قائمة الفنانين
router.get("/:artistId/reviews", optionalAuth, getArtistReviews); // تقييمات الفنان

// Protected routes (Artist only)
router.get(
  "/my/profile-views",
  protect,
  restrictTo("artist"),
  getMyProfileViews,
);
// Dashboard stats
router.get("/dashboard/stats", protect, restrictTo("artist"), getDashboardStats);
router.get("/my/artworks-analytics", protect, getMyArtworksAnalytics);

// Artist orders
router.get("/orders", protect, restrictTo("artist"), getArtistOrders);
router.get("/:artistId", getArtistPublicProfile); // بروفايل فنان + لوحاته

module.exports = router;
