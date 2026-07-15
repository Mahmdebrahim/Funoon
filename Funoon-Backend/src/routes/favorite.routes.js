// src/routes/favorite.routes.js
const express = require("express");
const router = express.Router();

const favoriteController = require("../controllers/favorite.controller");
const { protect } = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validation.middleware");
const { toggleFavoriteValidator } = require("../validators/favorite.validator");

// All routes require authentication
router.use(protect);

router.post(
  "/toggle",
  toggleFavoriteValidator,
  validate,
  favoriteController.toggleFavorite,
);
router.get("/", favoriteController.getMyFavorites);
router.get("/:artworkId/status", favoriteController.checkFavoriteStatus);

module.exports = router;
