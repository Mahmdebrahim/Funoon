// src/routes/withdrawal.routes.js
const express = require("express");
const router = express.Router();

const {
  requestWithdrawal,
  getMyWithdrawals,
} = require("../controllers/withdrawal.controller");
const { protect, restrictTo } = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validation.middleware");
const {
  requestWithdrawalValidator,
} = require("../validators/withdrawal.validator");

// All routes require authentication and artist role
router.use(protect);
router.use(restrictTo("artist"));

router.post("/", requestWithdrawalValidator, validate, requestWithdrawal);
router.get("/my", getMyWithdrawals);

module.exports = router;
