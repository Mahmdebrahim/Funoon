// src/routes/order.routes.js
const express = require("express");
const router = express.Router();

const orderController = require("../controllers/order.controller");
const { protect, restrictTo } = require("../middlewares/auth.middleware");

// Protected routes (Buyer)
router.post("/checkout", protect, orderController.checkout);
router.put(
  "/:orderId/confirm-delivery",
  protect,
  orderController.confirmDelivery,
);

// Protected routes (Artist)
router.put(
  "/:orderId/process",
  protect,
  restrictTo("artist"),
  orderController.processOrder,
);
// router.put(
//   "/:orderId/ship",
//   protect,
//   restrictTo("artist"),
//   orderController.shipOrder,
// );

module.exports = router;
