// src/routes/artist.routes.js
const express = require("express");
const router = express.Router();

const {
  getAllArtists,
  getArtistPublicProfile,
  getMyProfileViews,
} = require("../controllers/artist.controller");
const { protect, restrictTo } = require("../middlewares/auth.middleware");

// Public routes
router.get("/", getAllArtists); // قائمة الفنانين
router.get("/:artistId", getArtistPublicProfile); // بروفايل فنان + لوحاته

// Protected routes (Artist only)
router.get(
  "/my/profile-views",
  protect,
  restrictTo("artist"),
  getMyProfileViews,
);

module.exports = router;
