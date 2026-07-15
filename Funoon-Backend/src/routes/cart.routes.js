const express = require("express");
const router = express.Router();

const cartController = require("../controllers/cart.controller");
const { protect } = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validation.middleware");
const { addToCartValidator } = require("../validators/cart.validator");

// All routes require authentication
router.use(protect);

router.get("/", cartController.getCart);
router.post("/items", addToCartValidator, validate, cartController.addToCart);
router.delete("/items/:artworkId", cartController.removeFromCart);
router.delete("/", cartController.clearCart);

module.exports = router;
