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

  if (!accountHolder || !iban || !bankName) {
    throw new BadRequestError("accountHolder, iban, and bankName are required");
  }

  // ✅ IBAN validation (Saudi: SA + 22 digits = 24 chars)
  const cleanedIban = iban.toUpperCase().replace(/\s/g, "");
  if (!/^SA\d{22}$/.test(cleanedIban)) {
    throw new BadRequestError(
      "Invalid Saudi IBAN. Must start with SA followed by 22 digits (24 characters total).",
    );
  }

  const bankAccount = await BankAccount.findOneAndUpdate(
    { user: req.user._id },
    {
      accountHolder,
      iban: cleanedIban,
      bankName,
      isVerified: false, // ✅ لازم الأدمن يراجع تاني
      verifiedAt: undefined,
      verifiedBy: undefined,
      rejectionReason: undefined,
    },
    { upsert: true, new: true, runValidators: true },
  );

  return ApiResponse.success(res, bankAccount, "Bank account saved. Pending admin verification.");
});

// @desc    Get my bank account
// @route   GET /api/v1/bank-account
// @access  Private (Artist only)
const getMyBankAccount = catchAsync(async (req, res, next) => {
  const bankAccount = await BankAccount.findOne({ user: req.user._id });
  if (!bankAccount) {
    throw new NotFoundError("No bank account found. Please add your bank details first.");
  }
  return ApiResponse.success(res, bankAccount, "Bank account retrieved");
});

module.exports = {
  setBankAccount,
  getMyBankAccount,
};
