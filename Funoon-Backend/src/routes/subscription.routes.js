// src/routes/subscription.routes.js
const express = require("express");
const router = express.Router();

const {
  purchaseSubscription,
  getMySubscription,
  getMySubscriptionPayments,
} = require("../controllers/subscription.controller");
const { protect } = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validation.middleware");
const {
  purchaseSubscriptionValidator,
} = require("../validators/subscription.validator");

// All routes require authentication
router.use(protect);

// Purchase a plan
router.post(
  "/purchase",
  purchaseSubscriptionValidator,
  validate,
  purchaseSubscription,
);

// Get my subscription details
router.get("/my", getMySubscription);

// Get my payment history
router.get("/my/payments", getMySubscriptionPayments);

module.exports = router;
