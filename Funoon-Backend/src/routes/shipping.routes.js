// src/routes/shipping.routes.js
const express = require("express");
const router = express.Router();

const {
  calculateShipping,
  createShipment,
  getAWBUrl,
  trackShipment,
  handleOTOWebhook,
} = require("../controllers/shipping.controller");
const { protect, restrictTo } = require("../middlewares/auth.middleware");

// Public (OTO Webhook)
router.post("/webhooks/oto", handleOTOWebhook);

// Protected
router.post("/calculate", protect, calculateShipping);
router.post("/create", protect, restrictTo("artist", "admin"), createShipment);
router.get("/:orderId/awb", protect, getAWBUrl);
router.get("/:orderId/track", protect, trackShipment);

module.exports = router;


