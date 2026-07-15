// src/controllers/admin-withdrawal.controller.js
const mongoose = require("mongoose");
const Withdrawal = require("../models/Withdrawal");
const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");
const { BadRequestError, NotFoundError } = require("../utils/api-error");
const ApiResponse = require("../utils/api-response");
const catchAsync = require("../utils/catch-async");

// @desc    Get all withdrawal requests (admin)
// @route   GET /api/v1/admin/withdrawals
// @access  Private (Admin only)
const getAllWithdrawals = catchAsync(async (req, res, next) => {
  const { status, page = 1, limit = 20 } = req.query;
  const filter = status ? { status } : {};
  const skip = (Number(page) - 1) * Number(limit);

  const withdrawals = await Withdrawal.find(filter)
    .populate("user", "name email phone")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  const total = await Withdrawal.countDocuments(filter);

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

// @desc    Approve withdrawal request
// @route   PUT /api/v1/admin/withdrawals/:id/approve
// @access  Private (Admin only)
const approveWithdrawal = catchAsync(async (req, res, next) => {
  const withdrawal = await Withdrawal.findById(req.params.id);
  if (!withdrawal) throw new NotFoundError("Withdrawal not found");

  if (withdrawal.status !== "PENDING") {
    throw new BadRequestError(
      `Cannot approve withdrawal with status: ${withdrawal.status}`,
    );
  }

  withdrawal.status = "APPROVED";
  await withdrawal.save();

  // TODO: Send email to artist that withdrawal is approved

  return ApiResponse.success(
    res,
    withdrawal,
    "Withdrawal approved. Please transfer manually.",
  );
});

// @desc    Mark withdrawal as paid (after manual transfer)
// @route   PUT /api/v1/admin/withdrawals/:id/mark-paid
// @access  Private (Admin only)
const markWithdrawalAsPaid = catchAsync(async (req, res, next) => {
  const { transferReference } = req.body; // رقم العملية البنكية

  if (!transferReference) {
    throw new BadRequestError("Transfer reference is required");
  }

  const withdrawal = await Withdrawal.findById(req.params.id);
  if (!withdrawal) throw new NotFoundError("Withdrawal not found");

  if (withdrawal.status !== "APPROVED") {
    throw new BadRequestError(
      "Withdrawal must be approved first before marking as paid",
    );
  }

  withdrawal.status = "PAID";
  withdrawal.transferReference = transferReference;
  withdrawal.paidAt = new Date();
  await withdrawal.save();

  // TODO: Send email to artist that funds have been transferred

  return ApiResponse.success(
    res,
    withdrawal,
    "Withdrawal marked as paid successfully",
  );
});

// @desc    Reject withdrawal request (refund to wallet)
// @route   PUT /api/v1/admin/withdrawals/:id/reject
// @access  Private (Admin only)
const rejectWithdrawal = catchAsync(async (req, res, next) => {
  const { reason } = req.body;

  if (!reason) {
    throw new BadRequestError("Rejection reason is required");
  }

  const withdrawal = await Withdrawal.findById(req.params.id);
  if (!withdrawal) throw new NotFoundError("Withdrawal not found");

  if (withdrawal.status !== "PENDING") {
    throw new BadRequestError("Can only reject pending withdrawal requests");
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Update withdrawal status
    withdrawal.status = "REJECTED";
    withdrawal.rejectionReason = reason;
    await withdrawal.save({ session });

    // ✅ Refund to wallet using $inc (أفضل من التعديل المباشر)
    const wallet = await Wallet.findOneAndUpdate(
      { user: withdrawal.user },
      { $inc: { "balance.available": withdrawal.amount } },
      { session, new: true },
    );

    if (!wallet) {
      throw new NotFoundError("Wallet not found for this user");
    }

    // ✅ Create transaction record with correct type
    await Transaction.create(
      [
        {
          wallet: wallet._id,
          withdrawal: withdrawal._id,
          user: withdrawal.user,
          type: "ADJUSTMENT", // ✅ صح - مش CREDIT_WITHDRAWAL_REFUND
          amount: withdrawal.amount,
          description: `Withdrawal rejected - amount refunded: ${withdrawal.amount} SAR. Reason: ${reason}`,
          balanceAfter: {
            available: wallet.balance.available,
            pending: wallet.balance.pending,
          },
          status: "COMPLETED",
        },
      ],
      { session },
    );

    await session.commitTransaction();
    session.endSession();

    // TODO: Send email to artist about rejection

    return ApiResponse.success(
      res,
      withdrawal,
      "Withdrawal rejected and funds refunded to wallet",
    );
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
});

module.exports = {
  getAllWithdrawals,
  approveWithdrawal,
  markWithdrawalAsPaid,
  rejectWithdrawal,
};
