// src/routes/bank-account.routes.js
const express = require("express");
const router = express.Router();

const {
  setBankAccount,
  getMyBankAccount,
} = require("../controllers/bank-account.controller");
const { protect, restrictTo } = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validation.middleware");
const {
  setBankAccountValidator,
} = require("../validators/bank-account.validator");

// All routes require authentication and artist role
router.use(protect);
router.use(restrictTo("artist"));

router.post("/", setBankAccountValidator, validate, setBankAccount);
router.get("/", getMyBankAccount);

module.exports = router;
