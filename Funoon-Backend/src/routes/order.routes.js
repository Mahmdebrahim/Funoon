// src/routes/order.routes.js
const express = require("express");
const router = express.Router();

const orderController = require("../controllers/order.controller");
const { protect, restrictTo } = require("../middlewares/auth.middleware");

// Protected routes (Buyer)
router.post("/checkout", protect, orderController.checkout);
// router.post("/verify-payment", protect, orderController.verifyPayment);

// Protected routes (Artist)
router.put(
  "/:orderId/process",
  protect,
  restrictTo("artist"),
  orderController.processOrder,
);
router.patch("/:orderId/cancel", protect, orderController.cancelOrder);
router.get("/my-orders", protect, orderController.getMyOrders);
router.get("/my-sales", protect, orderController.getMySales);
router.get("/:id", protect, orderController.getOrderById);
router.patch(
  "/:orderId/confirm-delivery",
  protect,
  orderController.confirmDelivery,
);
router.put("/:orderId/status", protect, orderController.updateOrderStatus);
// router.put(
//   "/:orderId/ship",
//   protect,
//   restrictTo("artist"),  
//   orderController.shipOrder,
// );

module.exports = router;
