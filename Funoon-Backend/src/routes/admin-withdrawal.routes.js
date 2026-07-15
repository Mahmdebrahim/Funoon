// src/routes/admin-withdrawal.routes.js
const express = require("express");
const router = express.Router();

const {
  getAllWithdrawals,
  approveWithdrawal,
  markWithdrawalAsPaid,
  rejectWithdrawal,
} = require("../controllers/admin.controller");
const { protect, restrictTo } = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validation.middleware");
const {
  approveWithdrawalValidator,
  markPaidWithdrawalValidator,
  rejectWithdrawalValidator,
} = require("../validators/admin-withdrawal.validator");

// All routes require authentication and admin role
router.use(protect);
router.use(restrictTo("admin"));

router.get("/", getAllWithdrawals);
router.put(
  "/:id/approve",
  approveWithdrawalValidator,
  validate,
  approveWithdrawal,
);
router.put(
  "/:id/mark-paid",
  markPaidWithdrawalValidator,
  validate,
  markWithdrawalAsPaid,
);
router.put(
  "/:id/reject",
  rejectWithdrawalValidator,
  validate,
  rejectWithdrawal,
);

module.exports = router;
