// src/controllers/bank-account.controller.js
const BankAccount = require("../models/BankAccount");
const { BadRequestError, NotFoundError } = require("../utils/api-error");
const ApiResponse = require("../utils/api-response");
const catchAsync = require("../utils/catch-async");

// @desc    Set/Update bank account
// @route   POST /api/v1/bank-account
// @access  Private (Artist only)
const setBankAccount = catchAsync(async (req, res, next) => {
  const { accountHolder, iban, bankName } = req.body;

  // Upsert: لو موجود يحدث، لو مش موجود يعمل جديد
  const bankAccount = await BankAccount.findOneAndUpdate(
    { user: req.user._id },
    {
      accountHolder,
      iban: iban.toUpperCase().replace(/\s/g, ""), // نظف المسافات
      bankName,
      isVerified: false, // لازم الأدمن يراجع تاني
    },
    { upsert: true, new: true, runValidators: true },
  );

  return ApiResponse.success(
    res,
    bankAccount,
    "Bank account saved successfully",
  );
});

// @desc    Get my bank account
// @route   GET /api/v1/bank-account
// @access  Private (Artist only)
const getMyBankAccount = catchAsync(async (req, res, next) => {
  const bankAccount = await BankAccount.findOne({ user: req.user._id });

  if (!bankAccount) {
    throw new NotFoundError(
      "No bank account found. Please add your bank details first.",
    );
  }

  return ApiResponse.success(
    res,
    bankAccount,
    "Bank account retrieved successfully",
  );
});

module.exports = {
  setBankAccount,
  getMyBankAccount,
};
