// src/controllers/withdrawal.controller.js
const mongoose = require("mongoose");
const Withdrawal = require("../models/Withdrawal");
const BankAccount = require("../models/BankAccount");
const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");
const { BadRequestError } = require("../utils/api-error");
const ApiResponse = require("../utils/api-response");
const catchAsync = require("../utils/catch-async");

// @desc    Request withdrawal
// @route   POST /api/v1/withdrawals
// @access  Private (Artist only)
const requestWithdrawal = catchAsync(async (req, res, next) => {
  const { amount } = req.body;
  const userId = req.user._id;

  // 1. Check minimum amount
  if (amount < 50) {
    throw new BadRequestError("Minimum withdrawal amount is 50 SAR");
  }

  // 2. Check weekly limit (once per 7 days)
  const lastWithdrawal = await Withdrawal.findOne({ user: userId }).sort({
    createdAt: -1,
  });

  if (lastWithdrawal) {
    const daysSinceLast =
      (Date.now() - lastWithdrawal.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceLast < 7) {
      const daysToWait = Math.ceil(7 - daysSinceLast);
      throw new BadRequestError(
        `You can request withdrawal once per week. Please wait ${daysToWait} more day(s).`,
      );
    }
  }

  // 3. Check wallet balance
  const wallet = await Wallet.findOne({ user: userId });
  if (!wallet || wallet.balance.available < amount) {
    throw new BadRequestError("Insufficient available balance");
  }

  // 4. Check bank account exists
  const bankAccount = await BankAccount.findOne({ user: userId });
  if (!bankAccount) {
    throw new BadRequestError("Please add your bank account details first");
  }

  // 5. Process withdrawal in transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Debit from wallet
    await wallet.debitAvailable(amount, session);

    // Create withdrawal request
    const withdrawal = await Withdrawal.create(
      [
        {
          user: userId,
          amount,
          status: "PENDING",
          bankDetails: {
            iban: bankAccount.iban,
            accountHolder: bankAccount.accountHolder,
            bankName: bankAccount.bankName,
          },
        },
      ],
      { session },
    );

    // Create transaction record
    await Transaction.create(
      [
        {
          wallet: wallet._id,
          withdrawal: withdrawal[0]._id,
          user: userId,
          type: "DEBIT_WITHDRAWAL",
          amount,
          description: `Withdrawal request #${withdrawal[0]._id}`,
          balanceAfter: {
            available: wallet.balance.available,
            pending: wallet.balance.pending,
          },
          status: "PENDING",
        },
      ],
      { session },
    );

    await session.commitTransaction();
    session.endSession();

    // TODO: Send email to admin about new withdrawal request

    return ApiResponse.success(
      res,
      withdrawal[0],
      "Withdrawal request submitted successfully",
    );
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
});

// @desc    Get my withdrawal history
// @route   GET /api/v1/withdrawals/my
// @access  Private (Artist only)
const getMyWithdrawals = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const withdrawals = await Withdrawal.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  const total = await Withdrawal.countDocuments({ user: req.user._id });

  return ApiResponse.success(
    res,
    {
      withdrawals,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        limit: Number(limit),
      },
    },
    "Withdrawals retrieved successfully",
  );
});

module.exports = {
  requestWithdrawal,
  getMyWithdrawals,
};
