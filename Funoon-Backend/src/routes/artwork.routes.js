const express = require("express");
const router = express.Router();

const artworkController = require("../controllers/artwork.controller");
const { protect, restrictTo, optionalAuth } = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validation.middleware");
const upload = require("../middlewares/upload.middleware");

const {
  createArtworkValidator,
  updateArtworkValidator,
} = require("../validators/artwork.validator");

// Public Routes

// List all artworks (with filters, pagination, sorting)
router.get("/", optionalAuth, artworkController.listAllArtworks);

// Get single artwork details
router.get("/:id", optionalAuth, artworkController.getArtworkDetails);


// Protected Routes (Artist only)
router.use(protect);
router.use(restrictTo("artist"));

// Create new artwork
router.post(
  "/",
  upload.array("images", 10),
  createArtworkValidator,
  validate,
  artworkController.createArtwork,
);

// Update artwork
router.put(
  "/:id",
  upload.array("images", 10),
  updateArtworkValidator,
  validate,
  artworkController.updateArtwork,
);

// Delete artwork
router.delete("/:id", artworkController.deleteArtwork);

// Toggle active/inactive status
router.patch("/:id/toggle-active", artworkController.toggleActiveStatus);

module.exports = router;
