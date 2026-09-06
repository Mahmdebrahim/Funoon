const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");
const ApiResponse = require("../utils/api-response");
const catchAsync = require("../utils/catch-async");

// @desc    Get my wallet balance
// @route   GET /api/v1/wallet
// @access  Private (Artist)
const getMyWallet = catchAsync(async (req, res, next) => {
  const wallet = await Wallet.findOne({ user: req.user._id });

  if (!wallet) {
    return ApiResponse.success(
      res,
      {
        balance: { available: 0, pending: 0 },
        totalEarned: 0,
        totalWithdrawn: 0,
      },
      "No wallet found",
    );
  }

  return ApiResponse.success(
    res,
    {
      balance: wallet.balance,
      totalEarned: wallet.totalEarned,
      totalWithdrawn: wallet.totalWithdrawn,
    },
    "Wallet retrieved",
  );
});

// @desc    Get my transaction history
// @route   GET /api/v1/wallet/transactions
// @access  Private (Artist)
const getMyTransactions = catchAsync(async (req, res, next) => {
  const { type, page = 1, limit = 20 } = req.query;
  const userId = req.user._id;

  const query = { user: userId };
  if (type) query.type = type;

  const skip = (Number(page) - 1) * Number(limit);

  const transactions = await Transaction.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))
    .populate("order", "status items.artwork");

  const total = await Transaction.countDocuments(query);

  return ApiResponse.success(
    res,
    {
      transactions,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
      },
    },
    "Transactions retrieved",
  );
});

module.exports = {
  getMyWallet,
  getMyTransactions,
};
