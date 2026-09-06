// src/controllers/withdrawal.controller.js
const mongoose = require("mongoose");
const Withdrawal = require("../models/Withdrawal");
const BankAccount = require("../models/BankAccount");
const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");
const { BadRequestError, ForbiddenError } = require("../utils/api-error");
const ApiResponse = require("../utils/api-response");
const catchAsync = require("../utils/catch-async");
const eventEmitter = require("../events/event-emitter");
const EVENTS = require("../events/events");

// @desc    Request withdrawal
// @route   POST /api/v1/withdrawals
// @access  Private (Artist only)
const requestWithdrawal = catchAsync(async (req, res, next) => {
  const { amount } = req.body;
  const userId = req.user._id;

  const MIN_AMOUNT = 50;
  const MAX_AMOUNT = 20000;
  const MAX_PER_WEEK = 2;

  if (req.user.isBanned) {
    throw new ForbiddenError("حسابك محظور — السحب غير متاح");
  }

  const value = Number(amount);
  if (!value || value <= 0) {
    throw new BadRequestError("مبلغ غير صالح");
  }

  if (value < MIN_AMOUNT) {
    throw new BadRequestError(`الحد الأدنى للسحب ${MIN_AMOUNT} ر.س`);
  }
  if (value > MAX_AMOUNT) {
    throw new BadRequestError(
      `الحد الأقصى للسحب في الطلب الواحد ${MAX_AMOUNT.toLocaleString()} ر.س`,
    );
  }

  const activeWithdrawal = await Withdrawal.findOne({
    user: userId,
    status: { $in: ["PENDING", "APPROVED"] },
  });
  if (activeWithdrawal) {
    throw new BadRequestError(
      "لديك طلب سحب قيد المعالجة بالفعل — انتظر الانتهاء منه قبل طلب جديد.",
    );
  }

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const weeklyCount = await Withdrawal.countDocuments({
    user: userId,
    createdAt: { $gte: weekAgo },
    status: { $ne: "REJECTED" },
  });
  if (weeklyCount >= MAX_PER_WEEK) {
    throw new BadRequestError(
      `تم الوصول للحد الأقصى (${MAX_PER_WEEK}) من طلبات السحب خلال 7 أيام — حاول لاحقاً.`,
    );
  }

  const wallet = await Wallet.findOne({ user: userId });
  if (!wallet || wallet.balance.available < value) {
    throw new BadRequestError("الرصيد المتاح غير كافٍ لهذا السحب");
  }
  const bankAccount = await BankAccount.findOne({ user: userId });
  if (!bankAccount) {
    throw new BadRequestError("يرجى إضافة بيانات حسابك البنكي أولاً");
  }
  if (!bankAccount.isVerified) {
    throw new BadRequestError(
      "حسابك البنكي قيد المراجعة. سيتم إخطارك عند التوثيق.",
    );
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    await wallet.debitAvailable(value, session);

    const withdrawal = await Withdrawal.create(
      [
        {
          user: userId,
          amount: value,
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

    await Transaction.create(
      [
        {
          wallet: wallet._id,
          withdrawal: withdrawal[0]._id,
          user: userId,
          type: "DEBIT_WITHDRAWAL",
          amount: value,
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

    eventEmitter.safeEmit(EVENTS.WITHDRAWAL_REQUESTED, {
      userId,
      userName: req.user.name,
      amount: value,
    });

    return ApiResponse.success(
      res,
      withdrawal[0],
      "تم إرسال طلب السحب بنجاح — سيتم مراجعته خلال 3-5 أيام عمل",
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
