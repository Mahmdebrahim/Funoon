const mongoose = require("mongoose");
const Withdrawal = require("../models/Withdrawal");
const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");
const { BadRequestError, NotFoundError } = require("../utils/api-error");
const ApiResponse = require("../utils/api-response");
const catchAsync = require("../utils/catch-async");
const Order = require("../models/Order");
const User = require("../models/User");
const Cart = require("../models/Cart");
const AuditLog = require("../models/AuditLog");
const Artwork = require("../models/Artwork");
const BankAccount = require("../models/BankAccount");
const SubscriptionPayment = require("../models/SubscriptionPayment");
const eventEmitter = require("../events/event-emitter");
const EVENTS = require("../events/events");

// ═══════════════════════════════════════════════════
//* Withdrawals
// ═══════════════════════════════════════════════════

// @desc    Get all withdrawal requests (admin) + bank info
// @route   GET /api/v1/admin/withdrawals
const getAllWithdrawals = catchAsync(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const filter = status && status !== "all" ? { status } : {};
  const skip = (Number(page) - 1) * Number(limit);

  const withdrawals = await Withdrawal.find(filter)
    .populate("user", "name email phone")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  const total = await Withdrawal.countDocuments(filter);

  // ✅ Best-effort: إرفاق الحساب البنكي لكل فنان (لو الموديل موجود)
  let bankByUser = {};
  try {
    const BankAccount = mongoose.model("BankAccount");
    const userIds = withdrawals.map((w) => w.user?._id).filter(Boolean);
    if (userIds.length) {
      const accounts = await BankAccount.find({ user: { $in: userIds } });
      for (const acc of accounts) {
        const uid = acc.user.toString();
        // نفضّل الموثّق، ولو مفيش نخد الأحدث
        if (
          !bankByUser[uid] ||
          (acc.isVerified && !bankByUser[uid].isVerified)
        ) {
          bankByUser[uid] = acc;
        }
      }
    }
  } catch (e) {
    /* الموديل مش مسجل — نتجاهل بهدوء */
  }

  const result = withdrawals.map((w) => ({
    ...w.toObject(),
    bankAccount: bankByUser[w.user?._id?.toString()] || null,
  }));

  return ApiResponse.success(
    res,
    {
      withdrawals: result,
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
const approveWithdrawal = catchAsync(async (req, res) => {
  const withdrawal = await Withdrawal.findById(req.params.id);
  if (!withdrawal) throw new NotFoundError("Withdrawal not found");

  if (withdrawal.status !== "PENDING") {
    throw new BadRequestError(
      `Cannot approve withdrawal with status: ${withdrawal.status}`,
    );
  }

  withdrawal.status = "APPROVED";
  withdrawal.approvedAt = new Date();
  withdrawal.approvedBy = req.user._id;
  await withdrawal.save();

  eventEmitter.safeEmit(EVENTS.WITHDRAWAL_APPROVED, {
    userId: withdrawal.user,
    amount: withdrawal.amount,
  });

  await AuditLog.create([
    {
      admin: req.user._id,
      action: "APPROVE_WITHDRAWAL",
      targetType: "withdrawal",
      targetId: withdrawal._id,
      details: {
        amount: withdrawal.amount,
        artist: withdrawal.user?.name || withdrawal.user,
      },
      ip: req.ip,
    },
  ]);

  return ApiResponse.success(
    res,
    withdrawal,
    "Withdrawal approved. Please transfer manually.",
  );
});

// @desc    Mark withdrawal as paid
// @route   PUT /api/v1/admin/withdrawals/:id/mark-paid
const markWithdrawalAsPaid = catchAsync(async (req, res) => {
  const { transferReference } = req.body;

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
  withdrawal.paidBy = req.user._id;
  await withdrawal.save();

  eventEmitter.safeEmit(EVENTS.WITHDRAWAL_PAID, {
    userId: withdrawal.user,
    amount: withdrawal.amount,
    transferReference,
  });
  
  await AuditLog.create([
    {
      admin: req.user._id,
      action: "MARK_WITHDRAWAL_PAID",
      targetType: "withdrawal",
      targetId: withdrawal._id,
      details: { amount: withdrawal.amount, transferReference },
      ip: req.ip,
    },
  ]);

  return ApiResponse.success(
    res,
    withdrawal,
    "Withdrawal marked as paid successfully",
  );
});

// @desc    Reject withdrawal request (refund to wallet)
// @route   PUT /api/v1/admin/withdrawals/:id/reject
const rejectWithdrawal = catchAsync(async (req, res) => {
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
    withdrawal.status = "REJECTED";
    withdrawal.rejectionReason = reason;
    withdrawal.rejectedAt = new Date();
    withdrawal.rejectedBy = req.user._id;
    await withdrawal.save({ session });

    const wallet = await Wallet.findOneAndUpdate(
      { user: withdrawal.user },
      {
        $inc: {
          "balance.available": withdrawal.amount,
          totalWithdrawn: -withdrawal.amount,
        },
      },
      { session, new: true },
    );

    eventEmitter.safeEmit(EVENTS.WITHDRAWAL_REJECTED, {
      userId: withdrawal.user,
      amount: withdrawal.amount,
      reason,
    });

    if (!wallet) {
      throw new NotFoundError("Wallet not found for this user");
    }

    await Transaction.create(
      [
        {
          wallet: wallet._id,
          withdrawal: withdrawal._id,
          user: withdrawal.user,
          type: "ADJUSTMENT",
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
    await AuditLog.create(
      [
        {
          admin: req.user._id,
          action: "REJECT_WITHDRAWAL",
          targetType: "withdrawal",
          targetId: withdrawal._id,
          details: { amount: withdrawal.amount, reason },
          ip: req.ip,
        },
      ],
      { session },
    );
    await session.commitTransaction();
    session.endSession();

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

// @desc    Withdrawals summary cards
// @route   GET /api/v1/admin/withdrawals/summary
const getWithdrawalsSummary = catchAsync(async (req, res) => {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const group = [
    { $group: { _id: null, count: { $sum: 1 }, amount: { $sum: "$amount" } } },
  ];

  const [pending, approved, paidMonth, rejectedAll] = await Promise.all([
    Withdrawal.aggregate([{ $match: { status: "PENDING" } }, ...group]),
    Withdrawal.aggregate([{ $match: { status: "APPROVED" } }, ...group]),
    Withdrawal.aggregate([
      { $match: { status: "PAID", paidAt: { $gte: monthStart } } },
      ...group,
    ]),
    Withdrawal.aggregate([{ $match: { status: "REJECTED" } }, ...group]),
  ]);

  const pick = (arr) => arr[0] || { count: 0, amount: 0 };

  return ApiResponse.success(
    res,
    {
      pending: pick(pending),
      approved: pick(approved),
      paidThisMonth: pick(paidMonth),
      rejected: pick(rejectedAll),
    },
    "Withdrawals summary retrieved",
  );
});

// ═══════════════════════════════════════════════════
//* Orders — Hold / Unhold / Release
// ═══════════════════════════════════════════════════

// @desc    تجميد الأموال — مسموح فقط في حالة DELIVERED قبل الإطلاق
// @route   PATCH /api/v1/admin/orders/:orderId/hold
const holdOrderFunds = catchAsync(async (req, res) => {
  const { reason } = req.body;
  const order = await Order.findById(req.params.orderId);
  if (!order) throw new NotFoundError("Order not found");

  if (order.fundsReleased) {
    throw new BadRequestError("الأموال أُطلقت بالفعل، لا يمكن تجميدها");
  }

  if (order.onHold) {
    throw new BadRequestError("الطلب مجمّد بالفعل");
  }

  // ✅ guard: التجميد مسموح بس في DELIVERED (الفلوس مهددة بالإطلاق)
  if (order.status !== "DELIVERED") {
    throw new BadRequestError(
      `لا يمكن تجميد الطلب في الحالة الحالية (${order.status}). التجميد متاح فقط بعد التوصيل وقبل الإطلاق.`,
    );
  }

  order.onHold = true;
  order.holdReason = reason || "بلاغ من الدعم";
  await order.save();
  await AuditLog.create([
    {
      admin: req.user._id,
      action: "HOLD_ORDER",
      targetType: "order",
      targetId: order._id,
      details: {
        reason: order.holdReason,
        amount: order.financials.totalAmount,
      },
      ip: req.ip,
    },
  ]);

  return ApiResponse.success(res, order, "تم تجميد الطلب — لن يُطلق تلقائياً");
});

// @desc    فك التجميد — يستأنف المسار الطبيعي (cron الـ 72 ساعة)
// @route   PATCH /api/v1/admin/orders/:orderId/unhold
const unholdOrderFunds = catchAsync(async (req, res) => {
  const order = await Order.findById(req.params.orderId);
  if (!order) throw new NotFoundError("Order not found");

  if (!order.onHold) {
    throw new BadRequestError("الطلب غير مجمّد");
  }

  if (order.fundsReleased) {
    throw new BadRequestError("الأموال أُطلقت بالفعل");
  }

  order.onHold = false;
  order.holdReason = null;
  await order.save();
  await AuditLog.create([
    {
      admin: req.user._id,
      action: "UNHOLD_ORDER",
      targetType: "order",
      targetId: order._id,
      details: { amount: order.financials.totalAmount },
      ip: req.ip,
    },
  ]);

  return ApiResponse.success(
    res,
    order,
    "تم فك التجميد — سيستأنف مسار الإطلاق الطبيعي (72 ساعة بعد التوصيل)",
  );
});

// @desc    إطلاق فوري للأموال (يتخطى الـ 72 ساعة)
// @route   PATCH /api/v1/admin/orders/:orderId/release
const releaseOrderFunds = catchAsync(async (req, res) => {
  const order = await Order.findById(req.params.orderId);
  if (!order) throw new NotFoundError("Order not found");

  if (order.fundsReleased) {
    throw new BadRequestError("الأموال أُطلقت بالفعل");
  }

  // ✅ لازم الطلب يكون DELIVERED (مفيش إطلاق لطلبات مش مُوصّلة)
  if (order.status !== "DELIVERED") {
    throw new BadRequestError(
      `لا يمكن إطلاق أموال طلب حالته ${order.status}. يجب أن يكون الطلب مُوصَّلاً أولاً.`,
    );
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    order.onHold = false;
    order.fundsReleased = true;
    order.status = "COMPLETED";
    order.completedAt = new Date();
    await order.save({ session });

    const wallet = await Wallet.findOne({ user: order.artist }).session(
      session,
    );
    if (wallet) {
      await wallet.releaseToAvailable(
        order.financials.totalArtistEarning,
        session,
      );
      await Transaction.create(
        [
          {
            wallet: wallet._id,
            order: order._id,
            user: order.artist,
            type: "CREDIT_RELEASE",
            amount: order.financials.totalArtistEarning,
            description: `إطلاق يدوي لأموال الطلب #${order._id} بواسطة الأدمن`,
            balanceAfter: {
              available: wallet.balance.available,
              pending: wallet.balance.pending,
            },
            status: "COMPLETED",
          },
        ],
        { session },
      );
    }
    await AuditLog.create(
      [
        {
          admin: req.user._id,
          action: "RELEASE_FUNDS",
          targetType: "order",
          targetId: order._id,
          details: { amount: order.financials.totalArtistEarning },
          ip: req.ip,
        },
      ],
      { session },
    );
    await session.commitTransaction();
    session.endSession();

    eventEmitter.safeEmit(EVENTS.ORDER_FUNDS_RELEASED, {
      artistId: order.artist,
      amount: order.financials.totalArtistEarning,
    });

    return ApiResponse.success(res, order, "تم إطلاق الأموال بنجاح");
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
});

// ═══════════════════════════════════════════════════
//* Orders List (Admin)
// ═══════════════════════════════════════════════════

// @desc    Get all orders with filters
// @route   GET /api/v1/admin/orders?status=&search=&hold=&page=
const getAdminOrders = catchAsync(async (req, res) => {
  const { status, search, hold, page = 1, limit = 20 } = req.query;
  const filter = {};

  if (status && status !== "all") filter.status = status;
  if (hold === "true") {
    filter.onHold = true;
    filter.fundsReleased = false;
  }

  // ✅ بحث محسّن: ID جزئي (آخر 6 خانات) + أسماء المشتري/الفنان
  if (search && search.trim()) {
    const q = search.trim();
    const qLower = q.toLowerCase();

    // بحث بالأسماء
    const matchedUsers = await User.find({
      name: { $regex: q, $options: "i" },
    }).select("_id");

    const or = [];

    // مطابقة جزئية على الـ ObjectId (يشتغل مع أي جزء منه)
    or.push({
      $expr: {
        $ne: [
          { $indexOfCP: [{ $toLower: { $toString: "$_id" } }, qLower] },
          -1,
        ],
      },
    });

    if (matchedUsers.length) {
      const ids = matchedUsers.map((u) => u._id);
      or.push({ buyer: { $in: ids } }, { artist: { $in: ids } });
    }

    filter.$or = or;
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate("buyer", "name email phone")
      .populate("artist", "name email"),
    Order.countDocuments(filter),
  ]);

  return ApiResponse.success(
    res,
    {
      orders,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        limit: Number(limit),
      },
    },
    "Admin orders retrieved",
  );
});

// ═══════════════════════════════════════════════════
//* Stats (باقي الكود بدون تعديل)
// ═══════════════════════════════════════════════════

const PAID_STATUSES = [
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "COMPLETED",
];

const getPeriodStart = (period) => {
  const days = { "7d": 7, "30d": 30, "90d": 90, "365d": 365 }[period] || 30;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));
  return { start, days };
};

const fillDailySeries = (rows, days) => {
  const map = new Map(rows.map((r) => [r._id, r]));
  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const row = map.get(key);
    out.push({
      date: key,
      revenue: row ? row.revenue : 0,
      orders: row ? row.orders : 0,
    });
  }
  return out;
};

// @desc    Admin dashboard stats + growth
// @route   GET /api/v1/admin/stats?period=30d
// @access  Private (Admin)
// const getAdminStats = catchAsync(async (req, res) => {
//   const period = req.query.period || "30d";
//   const { start, days } = getPeriodStart(period);

//   const prevStart = new Date(start);
//   prevStart.setDate(prevStart.getDate() - days);

//   const paidMatch = { status: { $in: PAID_STATUSES } };

//   const now = new Date();
//   const monthStartNow = new Date(
//     Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0),
//   );

//   const twelveMonthsAgo = new Date();
//   twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
//   twelveMonthsAgo.setDate(1);
//   twelveMonthsAgo.setHours(0, 0, 0, 0);

//   // ═══ الجزء 1: البيانات الأساسية ═══
//   const [
//     totals,
//     periodAgg,
//     prevAgg,
//     daily,
//     byStatus,
//     topArtists,
//     usersCount,
//     buyersCount,
//     artistsCount,
//     sellingArtists,
//     pendingW,
//     onHoldAgg,
//     pendingArtworks,
//     recentOrders,
//     pendingWList,
//     onHoldList,
//   ] = await Promise.all([
//     Order.aggregate([
//       { $match: paidMatch },
//       {
//         $group: {
//           _id: null,
//           revenue: { $sum: "$financials.totalAmount" },
//           commission: { $sum: "$financials.totalCommission" },
//           artistEarnings: { $sum: "$financials.totalArtistEarning" },
//           orders: { $sum: 1 },
//         },
//       },
//     ]),
//     Order.aggregate([
//       { $match: { ...paidMatch, createdAt: { $gte: start } } },
//       {
//         $group: {
//           _id: null,
//           revenue: { $sum: "$financials.totalAmount" },
//           commission: { $sum: "$financials.totalCommission" },
//           orders: { $sum: 1 },
//         },
//       },
//     ]),
//     Order.aggregate([
//       { $match: { ...paidMatch, createdAt: { $gte: prevStart, $lt: start } } },
//       {
//         $group: {
//           _id: null,
//           revenue: { $sum: "$financials.totalAmount" },
//           orders: { $sum: 1 },
//         },
//       },
//     ]),
//     Order.aggregate([
//       { $match: { ...paidMatch, createdAt: { $gte: start } } },
//       {
//         $group: {
//           _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
//           revenue: { $sum: "$financials.totalAmount" },
//           orders: { $sum: 1 },
//         },
//       },
//       { $sort: { _id: 1 } },
//     ]),
//     Order.aggregate([
//       { $group: { _id: "$status", count: { $sum: 1 } } },
//       { $sort: { count: -1 } },
//     ]),
//     Order.aggregate([
//       { $match: paidMatch },
//       {
//         $group: {
//           _id: "$artist",
//           totalSales: { $sum: "$financials.totalAmount" },
//           orders: { $sum: 1 },
//         },
//       },
//       { $sort: { totalSales: -1 } },
//       { $limit: 5 },
//       {
//         $lookup: {
//           from: "users",
//           localField: "_id",
//           foreignField: "_id",
//           as: "artist",
//         },
//       },
//       { $unwind: "$artist" },
//       {
//         $project: {
//           _id: 0,
//           id: "$_id",
//           name: "$artist.name",
//           totalSales: 1,
//           orders: 1,
//         },
//       },
//     ]),
//     User.countDocuments(),
//     User.countDocuments({ role: "buyer" }),
//     User.countDocuments({ role: "artist" }),
//     Order.distinct("artist", paidMatch),
//     Withdrawal.aggregate([
//       { $match: { status: "PENDING" } },
//       {
//         $group: { _id: null, count: { $sum: 1 }, amount: { $sum: "$amount" } },
//       },
//     ]),
//     Order.aggregate([
//       { $match: { onHold: true, fundsReleased: false } },
//       {
//         $group: {
//           _id: null,
//           count: { $sum: 1 },
//           amount: { $sum: "$financials.totalAmount" },
//         },
//       },
//     ]),
//     Artwork.countDocuments({ approvalStatus: "PENDING_APPROVAL" }),
//     Order.find()
//       .sort({ createdAt: -1 })
//       .limit(6)
//       .select("status financials.totalAmount createdAt buyer artist")
//       .populate("buyer", "name")
//       .populate("artist", "name"),
//     Withdrawal.find({ status: "PENDING" })
//       .sort({ createdAt: -1 })
//       .limit(5)
//       .populate("user", "name email"),
//     Order.find({ onHold: true, fundsReleased: false })
//       .sort({ updatedAt: -1 })
//       .limit(5)
//       .select("status financials.totalAmount holdReason updatedAt buyer artist")
//       .populate("buyer", "name")
//       .populate("artist", "name"),
//   ]);

//   // ═══ الجزء 2: النمو (Promise.all منفصل — مستحيل يتلخبط) ═══
//   const [usersByMonth, citiesAgg, ordersHealthAgg, repeatAgg, newThisMonth] =
//     await Promise.all([
//       User.aggregate([
//         { $match: { createdAt: { $gte: twelveMonthsAgo } } },
//         {
//           $group: {
//             _id: {
//               m: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
//               role: "$role",
//             },
//             count: { $sum: 1 },
//           },
//         },
//       ]),
//       Order.aggregate([
//         { $match: paidMatch },
//         {
//           $group: {
//             _id: "$shipping.buyerAddress.city",
//             orders: { $sum: 1 },
//             revenue: { $sum: "$financials.totalAmount" },
//           },
//         },
//         { $match: { _id: { $ne: null, $ne: "" } } },
//         { $sort: { orders: -1 } },
//         { $limit: 5 },
//       ]),
//       Order.aggregate([
//         {
//           $match: {
//             createdAt: { $gte: twelveMonthsAgo },
//             $or: [
//               { status: { $in: PAID_STATUSES } },
//               {
//                 status: { $in: ["CANCELLED", "REFUNDED"] },
//                 "payment.paidAt": { $ne: null }, // ✅ اتدفع فعلاً
//               },
//             ],
//           },
//         },
//         {
//           $group: {
//             _id: {
//               m: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
//               type: {
//                 $cond: [
//                   { $in: ["$status", PAID_STATUSES] },
//                   "paid",
//                   "cancelled",
//                 ],
//               },
//             },
//             count: { $sum: 1 },
//           },
//         },
//       ]),
//       Order.aggregate([
//         { $match: paidMatch },
//         { $group: { _id: "$buyer", orderCount: { $sum: 1 } } },
//         {
//           $group: {
//             _id: null,
//             totalBuyers: { $sum: 1 },
//             repeatBuyers: {
//               $sum: { $cond: [{ $gte: ["$orderCount", 2] }, 1, 0] },
//             },
//           },
//         },
//       ]),
//       User.aggregate([
//         { $match: { createdAt: { $gte: monthStartNow } } },
//         { $group: { _id: "$role", count: { $sum: 1 } } },
//       ]),
//     ]);
//   console.log("🔍 Raw newThisMonth data:", newThisMonth);

//   // ═══ Processing ═══
//   const t = totals[0] || {
//     revenue: 0,
//     commission: 0,
//     artistEarnings: 0,
//     orders: 0,
//   };
//   const p = periodAgg[0] || { revenue: 0, commission: 0, orders: 0 };
//   const prev = prevAgg[0] || { revenue: 0, orders: 0 };
//   const pw = pendingW[0] || { count: 0, amount: 0 };
//   const oh = onHoldAgg[0] || { count: 0, amount: 0 };

//   const growthPct =
//     prev.revenue > 0
//       ? Math.round(((p.revenue - prev.revenue) / prev.revenue) * 100)
//       : null;

//   // ── usersSeries (12 شهر) ──
//   const uMap = {};
//   (usersByMonth || []).forEach((r) => {
//     uMap[r._id.m] = uMap[r._id.m] || { buyers: 0, artists: 0 };
//     if (r._id.role === "buyer") uMap[r._id.m].buyers = r.count;
//     if (r._id.role === "artist") uMap[r._id.m].artists = r.count;
//   });
//   const usersSeries = [];
//   for (let i = 11; i >= 0; i--) {
//     const d = new Date();
//     d.setDate(1);
//     d.setHours(0, 0, 0, 0);
//     d.setMonth(d.getMonth() - i);
//     const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
//     usersSeries.push({
//       key,
//       buyers: uMap[key]?.buyers || 0,
//       artists: uMap[key]?.artists || 0,
//     });
//   }

//   // ── ordersHealth series (12 شهر) ──
//   const hMap = {};
//   (ordersHealthAgg || []).forEach((r) => {
//     hMap[r._id.m] = hMap[r._id.m] || { paid: 0, cancelled: 0 };
//     hMap[r._id.m][r._id.type] = r.count;
//   });
//   const healthSeries = [];
//   let totPaid = 0,
//     totCancelled = 0;
//   for (let i = 11; i >= 0; i--) {
//     const d = new Date();
//     d.setDate(1);
//     d.setHours(0, 0, 0, 0);
//     d.setMonth(d.getMonth() - i);
//     const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
//     const e = hMap[key] || { paid: 0, cancelled: 0 };
//     totPaid += e.paid;
//     totCancelled += e.cancelled;
//     healthSeries.push({ key, paid: e.paid, cancelled: e.cancelled });
//   }
//   const cancelRate =
//     totPaid + totCancelled > 0
//       ? Math.round((totCancelled / (totPaid + totCancelled)) * 100)
//       : 0;

//   // ── new this month + repeat ──
//   const ntm = { buyers: 0, artists: 0 };
//   (newThisMonth || []).forEach((r) => {
//     if (r._id === "buyer") ntm.buyers = r.count;
//     if (r._id === "artist") ntm.artists = r.count;
//   });
//   const rep = (repeatAgg || [])[0] || { totalBuyers: 0, repeatBuyers: 0 };
//   const repeatRate = rep.totalBuyers
//     ? Math.round((rep.repeatBuyers / rep.totalBuyers) * 100)
//     : 0;

//   return ApiResponse.success(
//     res,
//     {
//       overview: {
//         totalRevenue: t.revenue || 0,
//         totalCommission: t.commission || 0,
//         totalArtistEarnings: t.artistEarnings || 0,
//         totalOrders: t.orders || 0,
//         avgOrderValue: t.orders ? Math.round(t.revenue / t.orders) : 0,
//         totalUsers: usersCount,
//         totalBuyers: buyersCount,
//         totalArtists: artistsCount,
//         sellingArtists: sellingArtists.length,
//         pendingWithdrawals: { count: pw.count, amount: pw.amount },
//         onHoldOrders: { count: oh.count, amount: oh.amount },
//         pendingArtworks: pendingArtworks || 0,
//       },
//       period: {
//         key: period,
//         days,
//         orders: p.orders || 0,
//         revenue: p.revenue || 0,
//         commission: p.commission || 0,
//         prevRevenue: prev.revenue || 0,
//         growth: growthPct,
//       },
//       charts: {
//         revenueByDay: fillDailySeries(daily || [], days),
//         ordersByStatus: byStatus || [],
//       },
//       topArtists: topArtists || [],
//       recentOrders: recentOrders || [],
//       pendingWithdrawalsList: pendingWList || [],
//       onHoldOrdersList: onHoldList || [],
//       growth: {
//         newUsersThisMonth: { ...ntm, total: ntm.buyers + ntm.artists },
//         repeatRate,
//         usersSeries,
//         topCities: citiesAgg || [],
//         ordersHealth: {
//           series: healthSeries,
//           cancelRate,
//           totalPaid: totPaid,
//           totalCancelled: totCancelled,
//         },
//       },
//     },
//     "Admin stats retrieved",
//   );
// });

const getAdminStats = catchAsync(async (req, res) => {
  const period = req.query.period || "30d";
  const { start, days } = getPeriodStart(period);

  const prevStart = new Date(start);
  prevStart.setDate(prevStart.getDate() - days);

  const paidMatch = { status: { $in: PAID_STATUSES } };

  // ═══════════════════════════════════════════════════════
  //  الجزء 1: البيانات الأساسية
  // ═══════════════════════════════════════════════════════
  const [
    totals,
    periodAgg,
    prevAgg,
    daily,
    byStatus,
    topArtists,
    usersCount,
    buyersCount,
    artistsCount,
    sellingArtists,
    pendingW,
    onHoldAgg,
    pendingArtworks,
    recentOrders,
    pendingWList,
    onHoldList,
  ] = await Promise.all([
    // 1. الإجماليات الكلية (كل الوقت)
    Order.aggregate([
      { $match: paidMatch },
      {
        $group: {
          _id: null,
          revenue: { $sum: "$financials.totalAmount" },
          commission: { $sum: "$financials.totalCommission" },
          artistEarnings: { $sum: "$financials.totalArtistEarning" },
          orders: { $sum: 1 },
        },
      },
    ]),

    // 2. بيانات الفترة المختارة
    Order.aggregate([
      { $match: { ...paidMatch, createdAt: { $gte: start } } },
      {
        $group: {
          _id: null,
          revenue: { $sum: "$financials.totalAmount" },
          commission: { $sum: "$financials.totalCommission" },
          orders: { $sum: 1 },
        },
      },
    ]),

    // 3. بيانات الفترة السابقة (لحساب النمو)
    Order.aggregate([
      { $match: { ...paidMatch, createdAt: { $gte: prevStart, $lt: start } } },
      {
        $group: {
          _id: null,
          revenue: { $sum: "$financials.totalAmount" },
          orders: { $sum: 1 },
        },
      },
    ]),

    // 4. الإيرادات اليومية (للرسم البياني)
    Order.aggregate([
      { $match: { ...paidMatch, createdAt: { $gte: start } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$financials.totalAmount" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),

    // 5. الطلبات حسب الحالة
    Order.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),

    // 6. أفضل الفنانين (يتأثر بالفلتر)
    Order.aggregate([
      { $match: { ...paidMatch, createdAt: { $gte: start } } },
      {
        $group: {
          _id: "$artist",
          totalSales: { $sum: "$financials.totalAmount" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { totalSales: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "artist",
        },
      },
      { $unwind: "$artist" },
      {
        $project: {
          _id: 0,
          id: "$_id",
          name: "$artist.name",
          totalSales: 1,
          orders: 1,
        },
      },
    ]),

    // 7-9. أعداد المستخدمين
    User.countDocuments(),
    User.countDocuments({ role: "buyer" }),
    User.countDocuments({ role: "artist" }),

    // 10. الفنانين اللي باعوا (كل الوقت)
    Order.distinct("artist", paidMatch),

    // 11. السحوبات المعلقة
    Withdrawal.aggregate([
      { $match: { status: "PENDING" } },
      {
        $group: { _id: null, count: { $sum: 1 }, amount: { $sum: "$amount" } },
      },
    ]),

    // 12. الطلبات المحجوزة
    Order.aggregate([
      { $match: { onHold: true, fundsReleased: false } },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          amount: { $sum: "$financials.totalAmount" },
        },
      },
    ]),

    // 13. الأعمال الفنية المعلقة
    Artwork.countDocuments({ approvalStatus: "PENDING_APPROVAL" }),

    // 14. آخر الطلبات
    Order.find()
      .sort({ createdAt: -1 })
      .limit(6)
      .select("status financials.totalAmount createdAt buyer artist")
      .populate("buyer", "name")
      .populate("artist", "name"),

    // 15. آخر السحوبات المعلقة
    Withdrawal.find({ status: "PENDING" })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("user", "name email"),

    // 16. آخر الطلبات المحجوزة
    Order.find({ onHold: true, fundsReleased: false })
      .sort({ updatedAt: -1 })
      .limit(5)
      .select("status financials.totalAmount holdReason updatedAt buyer artist")
      .populate("buyer", "name")
      .populate("artist", "name"),
  ]);

  // ═══════════════════════════════════════════════════════
  //  الجزء 2: النمو والرسوم البيانية (ديناميكي حسب الـ period)
  // ═══════════════════════════════════════════════════════
  const [usersInPeriod, citiesAgg, ordersHealthAgg, repeatAgg, usersSeriesAgg] =
    await Promise.all([
      // 1. المستخدمين الجدد في الفترة المختارة
      User.aggregate([
        { $match: { createdAt: { $gte: start } } },
        { $group: { _id: "$role", count: { $sum: 1 } } },
      ]),

      // 2. أفضل المدن (تتأثر بالفلتر)
      Order.aggregate([
        { $match: { ...paidMatch, createdAt: { $gte: start } } },
        {
          $group: {
            _id: "$shipping.buyerAddress.city",
            orders: { $sum: 1 },
            revenue: { $sum: "$financials.totalAmount" },
          },
        },
        { $match: { _id: { $ne: null, $ne: "" } } },
        { $sort: { orders: -1 } },
        { $limit: 5 },
      ]),

      // 3. صحة الطلبات (تجميع يومي للفترة المختارة)
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: start },
            $or: [
              { status: { $in: PAID_STATUSES } },
              {
                status: { $in: ["CANCELLED", "REFUNDED"] },
                "payment.paidAt": { $ne: null },
              },
            ],
          },
        },
        {
          $group: {
            _id: {
              d: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
              type: {
                $cond: [
                  { $in: ["$status", PAID_STATUSES] },
                  "paid",
                  "cancelled",
                ],
              },
            },
            count: { $sum: 1 },
          },
        },
      ]),

      // 4. معدل التكرار (للفترة المختارة)
      Order.aggregate([
        { $match: { ...paidMatch, createdAt: { $gte: start } } },
        { $group: { _id: "$buyer", orderCount: { $sum: 1 } } },
        {
          $group: {
            _id: null,
            totalBuyers: { $sum: 1 },
            repeatBuyers: {
              $sum: { $cond: [{ $gte: ["$orderCount", 2] }, 1, 0] },
            },
          },
        },
      ]),

      // 5. سلسلة المستخدمين للرسم البياني (تجميع يومي)
      User.aggregate([
        { $match: { createdAt: { $gte: start } } },
        {
          $group: {
            _id: {
              d: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
              role: "$role",
            },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

  // ═══════════════════════════════════════════════════════
  //  Processing
  // ═══════════════════════════════════════════════════════
  const t = totals[0] || {
    revenue: 0,
    commission: 0,
    artistEarnings: 0,
    orders: 0,
  };
  const p = periodAgg[0] || { revenue: 0, commission: 0, orders: 0 };
  const prev = prevAgg[0] || { revenue: 0, orders: 0 };
  const pw = pendingW[0] || { count: 0, amount: 0 };
  const oh = onHoldAgg[0] || { count: 0, amount: 0 };

  const growthPct =
    prev.revenue > 0
      ? Math.round(((p.revenue - prev.revenue) / prev.revenue) * 100)
      : null;

  // ── مستخدمين جدد في الفترة ──
  const ntm = { buyers: 0, artists: 0 };
  (usersInPeriod || []).forEach((r) => {
    const role = String(r._id);
    if (role === "buyer") ntm.buyers = r.count;
    if (role === "artist") ntm.artists = r.count;
  });

  // ── usersSeries (الرسم البياني للمستخدمين - يومي) ──
  const uMap = {};
  (usersSeriesAgg || []).forEach((r) => {
    uMap[r._id.d] = uMap[r._id.d] || { buyers: 0, artists: 0 };
    if (r._id.role === "buyer") uMap[r._id.d].buyers = r.count;
    if (r._id.role === "artist") uMap[r._id.d].artists = r.count;
  });

  const usersSeries = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().split("T")[0];
    usersSeries.push({
      key,
      buyers: uMap[key]?.buyers || 0,
      artists: uMap[key]?.artists || 0,
    });
  }

  // ── ordersHealth series (الرسم البياني لصحة الطلبات - يومي) ──
  const hMap = {};
  (ordersHealthAgg || []).forEach((r) => {
    hMap[r._id.d] = hMap[r._id.d] || { paid: 0, cancelled: 0 };
    hMap[r._id.d][r._id.type] = r.count;
  });

  const healthSeries = [];
  let totPaid = 0,
    totCancelled = 0;
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().split("T")[0];
    const e = hMap[key] || { paid: 0, cancelled: 0 };
    totPaid += e.paid;
    totCancelled += e.cancelled;
    healthSeries.push({ key, paid: e.paid, cancelled: e.cancelled });
  }

  const cancelRate =
    totPaid + totCancelled > 0
      ? Math.round((totCancelled / (totPaid + totCancelled)) * 100)
      : 0;

  // ── repeat rate ──
  const rep = (repeatAgg || [])[0] || { totalBuyers: 0, repeatBuyers: 0 };
  const repeatRate = rep.totalBuyers
    ? Math.round((rep.repeatBuyers / rep.totalBuyers) * 100)
    : 0;

  // ═══════════════════════════════════════════════════════
  //  Response
  // ═══════════════════════════════════════════════════════
  return ApiResponse.success(
    res,
    {
      overview: {
        totalRevenue: t.revenue || 0,
        totalCommission: t.commission || 0,
        totalArtistEarnings: t.artistEarnings || 0,
        totalOrders: t.orders || 0,
        avgOrderValue: t.orders ? Math.round(t.revenue / t.orders) : 0,
        totalUsers: usersCount,
        totalBuyers: buyersCount,
        totalArtists: artistsCount,
        sellingArtists: sellingArtists.length,
        pendingWithdrawals: { count: pw.count, amount: pw.amount },
        onHoldOrders: { count: oh.count, amount: oh.amount },
        pendingArtworks: pendingArtworks || 0,
      },
      period: {
        key: period,
        days,
        orders: p.orders || 0,
        revenue: p.revenue || 0,
        commission: p.commission || 0,
        prevRevenue: prev.revenue || 0,
        growth: growthPct,
      },
      charts: {
        revenueByDay: fillDailySeries(daily || [], days),
        ordersByStatus: byStatus || [],
      },
      topArtists: topArtists || [],
      recentOrders: recentOrders || [],
      pendingWithdrawalsList: pendingWList || [],
      onHoldOrdersList: onHoldList || [],
      growth: {
        newUsersInPeriod: { ...ntm, total: ntm.buyers + ntm.artists },
        repeatRate,
        usersSeries,
        topCities: citiesAgg || [],
        ordersHealth: {
          series: healthSeries,
          cancelRate,
          totalPaid: totPaid,
          totalCancelled: totCancelled,
        },
      },
    },
    "Admin stats retrieved",
  );
});

// @desc    Financial analytics (monthly)
// @route   GET /api/v1/admin/stats/financial
// @access  Private (Admin)
const getFinancialStats = catchAsync(async (req, res) => {
  // بداية الشهر الحالي
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  // بداية آخر 12 شهر
  const start = new Date(monthStart);
  start.setMonth(start.getMonth() - 11);

  const paidMatch = { status: { $in: PAID_STATUSES } };
  const mKey = (field = "$createdAt") => ({
    $dateToString: { format: "%Y-%m", date: field },
  });

  const [monthlyOrders, monthlySubs, monthlyW, escrow, thisMonth] =
    await Promise.all([
      Order.aggregate([
        { $match: { ...paidMatch, createdAt: { $gte: start } } },
        {
          $group: {
            _id: mKey(),
            revenue: { $sum: "$financials.totalAmount" },
            commission: { $sum: "$financials.totalCommission" },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      SubscriptionPayment
        ? SubscriptionPayment.aggregate([
            { $match: { createdAt: { $gte: start } } },
            // ⚠️ عدّل اسم الحقل لو الـ schema عندك مختلف (amount/status)
            {
              $group: {
                _id: mKey(),
                amount: { $sum: "$amount" },
                count: { $sum: 1 },
              },
            },
            { $sort: { _id: 1 } },
          ])
        : Promise.resolve([]),
      Withdrawal.aggregate([
        { $match: { status: "PAID", paidAt: { $gte: start } } },
        {
          $group: {
            _id: mKey("$paidAt"),
            amount: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Wallet.aggregate([
        {
          $group: {
            _id: null,
            pending: { $sum: "$balance.pending" },
            available: { $sum: "$balance.available" },
          },
        },
      ]),
      Order.aggregate([
        { $match: { ...paidMatch, createdAt: { $gte: monthStart } } },
        {
          $group: {
            _id: null,
            revenue: { $sum: "$financials.totalAmount" },
            commission: { $sum: "$financials.totalCommission" },
            orders: { $sum: 1 },
          },
        },
      ]),
    ]);

  // ✅ ندمج الـ 3 مصادر في سلسلة 12 شهر متصلة
  const oMap = new Map(monthlyOrders.map((r) => [r._id, r]));
  const sMap = new Map(monthlySubs.map((r) => [r._id, r]));
  const wMap = new Map(monthlyW.map((r) => [r._id, r]));

  const months = [];
  let bestMonth = { key: null, revenue: 0 };

  for (let i = 11; i >= 0; i--) {
    const d = new Date(monthStart);
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

    const o = oMap.get(key) || { revenue: 0, commission: 0, orders: 0 };
    const s = sMap.get(key) || { amount: 0, count: 0 };
    const w = wMap.get(key) || { amount: 0, count: 0 };

    months.push({
      key,
      revenue: o.revenue,
      commission: o.commission,
      subscriptions: s.amount,
      platformIncome: (o.commission || 0) + (s.amount || 0),
      withdrawals: w.amount,
      orders: o.orders,
    });

    if (o.revenue > bestMonth.revenue) bestMonth = { key, revenue: o.revenue };
  }

  const tm = thisMonth[0] || { revenue: 0, commission: 0, orders: 0 };
  const curKey = months[11].key;
  const e = escrow[0] || { pending: 0, available: 0 };

  return ApiResponse.success(
    res,
    {
      cards: {
        monthRevenue: tm.revenue || 0,
        monthCommission: tm.commission || 0,
        monthOrders: tm.orders || 0,
        monthSubscriptions: months[11].subscriptions,
        escrowPending: e.pending || 0,
        monthWithdrawals: months[11].withdrawals,
      },
      months,
      bestMonth,
    },
    "Financial stats retrieved",
  );
});

// ═══════════════════════════════════════════════════
//* Artists Management
// ═══════════════════════════════════════════════════
// مدة الباقات بالأيام — سنوية زي ما اتفقنا
const PLAN_DURATION_DAYS = {
  opal_classic: 365,
  opal_plus: 365,
  opal_prestige: 365,
};

// @desc    Get all artists with stats, wallet, bank, subscription
// @route   GET /api/v1/admin/artists?search=&page=
const getAdminArtists = catchAsync(async (req, res) => {
  const { search, page = 1, limit = 15 } = req.query;
  const filter = { role: "artist" };

  if (search && search.trim()) {
    const q = search.trim();
    filter.$or = [
      { name: { $regex: q, $options: "i" } },
      { email: { $regex: q, $options: "i" } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);

  const artists = await User.find(filter)
    .select("name email phone avatar createdAt subscription")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))
    .lean();

  const total = await User.countDocuments(filter);
  const artistIds = artists.map((a) => a._id);

  if (artistIds.length === 0) {
    return ApiResponse.success(
      res,
      {
        artists: [],
        pagination: {
          total,
          page: Number(page),
          pages: 0,
          limit: Number(limit),
        },
      },
      "Artists retrieved",
    );
  }

  // ⚡ Batch fetch كل البيانات المتعلقة بالتوازي
  const [wallets, bankAccounts, artworkCounts, salesAgg, lastSubs] =
    await Promise.all([
      Wallet.find({ user: { $in: artistIds } }).lean(),
      BankAccount.find({ user: { $in: artistIds } }).lean(),
      Artwork.aggregate([
        { $match: { artist: { $in: artistIds }, isActive: true } },
        { $group: { _id: "$artist", count: { $sum: 1 } } },
      ]),
      Order.aggregate([
        {
          $match: {
            artist: { $in: artistIds },
            status: { $in: PAID_STATUSES },
          },
        },
        {
          $group: {
            _id: "$artist",
            sales: { $sum: 1 },
            revenue: { $sum: "$financials.totalAmount" },
          },
        },
      ]),
      SubscriptionPayment.aggregate([
        { $match: { user: { $in: artistIds }, status: "PAID" } },
        { $sort: { paidAt: -1 } },
        { $group: { _id: "$user", last: { $first: "$$ROOT" } } },
      ]),
    ]);

  // Map to dictionaries
  const wMap = Object.fromEntries(wallets.map((w) => [w.user.toString(), w]));
  const bMap = Object.fromEntries(
    bankAccounts.map((b) => [b.user.toString(), b]),
  );
  const artMap = Object.fromEntries(
    artworkCounts.map((a) => [a._id.toString(), a.count]),
  );
  const salesMap = Object.fromEntries(
    salesAgg.map((s) => [s._id.toString(), s]),
  );
  const subMap = Object.fromEntries(
    lastSubs.map((s) => [s._id.toString(), s.last]),
  );

  const now = new Date();
  const result = artists.map((a) => {
    const id = a._id.toString();

    const sub = a.subscription;
    let subscription = null;

    if (sub?.plan && sub.plan !== "none") {
      const end = sub.endDate ? new Date(sub.endDate) : null;
      subscription = {
        plan: sub.plan,
        startsAt: sub.startDate,
        expiresAt: end,
        active: end ? end > now : false,
        pricePaid: sub.pricePaid,
        autoRenew: sub.autoRenew,
      };
    }

    return {
      ...a,
      wallet: wMap[id]
        ? {
            available: wMap[id].balance.available,
            pending: wMap[id].balance.pending,
          }
        : { available: 0, pending: 0 },
      bankAccount: bMap[id] || null,
      stats: {
        artworks: artMap[id] || 0,
        sales: salesMap[id]?.sales || 0,
        revenue: salesMap[id]?.revenue || 0,
      },
      subscription,
    };
  });

  return ApiResponse.success(
    res,
    {
      artists: result,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        limit: Number(limit),
      },
    },
    "Artists retrieved",
  );
});

// ═══════════════════════════════════════════════════
//* Bank Verification Queue
// ═══════════════════════════════════════════════════

// @desc    Get bank accounts pending verification
// @route   GET /api/v1/admin/bank-accounts/pending
const getPendingBankAccounts = catchAsync(async (req, res) => {
  const accounts = await BankAccount.find({
    isVerified: false,
    $or: [
      { rejectionReason: null },
      { rejectionReason: { $exists: false } },
      { rejectionReason: "" },
    ],
  })
    .populate("user", "name email phone avatar")
    .sort({ updatedAt: -1 });

  return ApiResponse.success(res, { accounts }, "Pending bank accounts");
});

// @desc    Verify bank account
// @route   PATCH /api/v1/admin/bank-accounts/:id/verify
const verifyBankAccount = catchAsync(async (req, res) => {
  const account = await BankAccount.findById(req.params.id);
  if (!account) throw new NotFoundError("Bank account not found");

  account.isVerified = true;
  account.verifiedAt = new Date();
  account.verifiedBy = req.user._id;
  account.rejectionReason = undefined;
  await account.save();

  await AuditLog.create([
    {
      admin: req.user._id,
      action: "VERIFY_BANK",
      targetType: "bankAccount",
      targetId: account._id,
      details: { bankName: account.bankName, iban: account.iban },
      ip: req.ip,
    },
  ]);

  return ApiResponse.success(res, account, "Bank account verified ");
});

// @desc    Reject bank account with reason
// @route   PATCH /api/v1/admin/bank-accounts/:id/reject
const rejectBankAccount = catchAsync(async (req, res) => {
  const { reason } = req.body;
  if (!reason) throw new BadRequestError("Rejection reason is required");

  const account = await BankAccount.findById(req.params.id);
  if (!account) throw new NotFoundError("Bank account not found");

  account.isVerified = false;
  account.verifiedAt = null;
  account.verifiedBy = null;
  account.rejectionReason = reason;
  await account.save();
  await AuditLog.create([
    {
      admin: req.user._id,
      action: "REJECT_BANK",
      targetType: "bankAccount",
      targetId: account._id,
      details: { bankName: account.bankName, iban: account.iban, reason },
      ip: req.ip,
    },
  ]);
  return ApiResponse.success(res, account, "Bank account rejected");
});

// ═══════════════════════════════════════════════════
//* Users Management (Ban / Unban)
// ═══════════════════════════════════════════════════

// @desc    Get all users with filters
// @route   GET /api/v1/admin/users?search=&role=&banned=&page=
const getAdminUsers = catchAsync(async (req, res) => {
  const { search, role, banned, page = 1, limit = 15 } = req.query;
  const filter = {};

  if (role && role !== "all") filter.role = role;
  if (banned === "true") filter.isBanned = true;
  if (banned === "false") filter.isBanned = { $ne: true };

  if (search && search.trim()) {
    const q = search.trim();
    filter.$or = [
      { name: { $regex: q, $options: "i" } },
      { email: { $regex: q, $options: "i" } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [users, total] = await Promise.all([
    User.find(filter)
      .select(
        "name email phone role avatar createdAt isBanned bannedAt banReason",
      )
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    User.countDocuments(filter),
  ]);

  const ids = users.map((u) => u._id);

  const [wallets, orderCounts] = await Promise.all([
    Wallet.find({ user: { $in: ids } }).lean(),
    Order.aggregate([
      { $match: { buyer: { $in: ids }, status: { $in: PAID_STATUSES } } },
      { $group: { _id: "$buyer", count: { $sum: 1 } } },
    ]),
  ]);

  const wMap = Object.fromEntries(wallets.map((w) => [w.user.toString(), w]));
  const oMap = Object.fromEntries(
    orderCounts.map((o) => [o._id.toString(), o.count]),
  );

  const result = users.map((u) => ({
    ...u.toObject(),
    wallet: wMap[u._id.toString()]
      ? {
          available: wMap[u._id.toString()].balance.available,
          pending: wMap[u._id.toString()].balance.pending,
        }
      : null,
    ordersCount: oMap[u._id.toString()] || 0,
  }));

  return ApiResponse.success(
    res,
    {
      users: result,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        limit: Number(limit),
      },
    },
    "Users retrieved",
  );
});

// @desc    Ban user (hide artworks, freeze wallet, cancel withdrawals)
// @route   PATCH /api/v1/admin/users/:id/ban
const banUser = catchAsync(async (req, res) => {
  const { reason } = req.body;
  if (!reason) throw new BadRequestError("Ban reason is required");

  const user = await User.findById(req.params.id);
  if (!user) throw new NotFoundError("User not found");
  if (user.role === "admin") throw new BadRequestError("Cannot ban an admin");
  if (user.isBanned) throw new BadRequestError("User is already banned");

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // 1. Ban the user
    user.isBanned = true;
    user.bannedAt = new Date();
    user.bannedBy = req.user._id;
    user.banReason = reason;
    await user.save({ session });

    // 2. Artist: hide artworks + cancel pending withdrawals
    if (user.role === "artist") {
      await Artwork.updateMany(
        { artist: user._id, isActive: true },
        { $set: { isActive: false } },
        { session },
      );

      const pendingWithdrawals = await Withdrawal.find({
        user: user._id,
        status: { $in: ["PENDING", "APPROVED"] },
      }).session(session);

      for (const w of pendingWithdrawals) {
        w.status = "REJECTED";
        w.rejectionReason = "تم إلغاء السحب بسبب حظر الحساب";
        await w.save({ session });

        await Wallet.findOneAndUpdate(
          { user: user._id },
          {
            $inc: { "balance.available": w.amount, totalWithdrawn: -w.amount },
          },
          { session },
        );
      }
    }

    // 3. Audit log
    await AuditLog.create(
      [
        {
          admin: req.user._id,
          action: "BAN_USER",
          targetType: "user",
          targetId: user._id,
          details: { reason, role: user.role },
          ip: req.ip,
        },
      ],
      { session },
    );

    await session.commitTransaction();
    session.endSession();

    return ApiResponse.success(res, user, "User banned successfully 🔒");
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
});

// @desc    Unban user (restore artworks)
// @route   PATCH /api/v1/admin/users/:id/unban
const unbanUser = catchAsync(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new NotFoundError("User not found");
  if (!user.isBanned) throw new BadRequestError("User is not banned");

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    user.isBanned = false;
    user.bannedAt = null;
    user.bannedBy = null;
    user.banReason = null;
    await user.save({ session });

    if (user.role === "artist") {
      await Artwork.updateMany(
        { artist: user._id },
        { $set: { isActive: true } },
        { session },
      );
    }

    await AuditLog.create(
      [
        {
          admin: req.user._id,
          action: "UNBAN_USER",
          targetType: "user",
          targetId: user._id,
          details: { role: user.role },
          ip: req.ip,
        },
      ],
      { session },
    );

    await session.commitTransaction();
    session.endSession();

    return ApiResponse.success(res, user, "User unbanned successfully ✅");
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
});

// ═══════════════════════════════════════════════════
//* Artworks Management (Admin) — Approval Flow
// ═══════════════════════════════════════════════════

// @desc    Get all artworks (admin) with filters
// @route   GET /api/v1/admin/artworks?status=&search=&artistId=&page=&limit=
const getAdminArtworks = catchAsync(async (req, res) => {
  const { status, search, artistId, page = 1, limit = 20 } = req.query;
  const filter = {};

  // Status filter: active/inactive/sold/pending/rejected/suspended
  if (status && status !== "all") {
    switch (status) {
      case "active":
        filter.isActive = true;
        filter.isSold = false;
        filter.approvalStatus = "APPROVED";
        break;
      case "inactive":
        filter.isActive = false;
        filter.isSold = false;
        filter.approvalStatus = "APPROVED";
        break;
      case "sold":
        filter.isSold = true;
        break;
      case "pending":
        filter.approvalStatus = "PENDING_APPROVAL";
        break;
      case "rejected":
        filter.approvalStatus = "REJECTED";
        break;
      case "suspended":
        filter.approvalStatus = "SUSPENDED";
        break;
    }
  }

  if (artistId && mongoose.Types.ObjectId.isValid(artistId)) {
    filter.artist = artistId;
  }

  if (search && search.trim()) {
    const q = search.trim();
    const matchedArtists = await User.find({
      name: { $regex: q, $options: "i" },
    }).select("_id");

    const or = [{ title: { $regex: q, $options: "i" } }];
    if (matchedArtists.length) {
      or.push({ artist: { $in: matchedArtists.map((u) => u._id) } });
    }
    filter.$or = or;
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [artworks, total] = await Promise.all([
    Artwork.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate("artist", "name email avatar subscription.plan isBanned")
      .populate("reviewedBy", "name")
      .lean(),
    Artwork.countDocuments(filter),
  ]);

  const artworkIds = artworks.map((a) => a._id);
  const orderCounts =
    artworkIds.length > 0
      ? await Order.aggregate([
          { $match: { "items.artwork": { $in: artworkIds } } },
          { $unwind: "$items" },
          {
            $group: {
              _id: "$items.artwork",
              ordersCount: { $sum: 1 },
              totalRevenue: { $sum: "$financials.totalAmount" },
            },
          },
        ])
      : [];

  const orderMap = Object.fromEntries(
    orderCounts.map((o) => [o._id.toString(), o]),
  );

  const result = artworks.map((a) => {
    const stats = orderMap[a._id.toString()] || { ordersCount: 0, totalRevenue: 0 };

    return {
      ...a,
      canHardDelete: stats.ordersCount === 0,
      stats,
    };
  });

  return ApiResponse.success(
    res,
    {
      artworks: result,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        limit: Number(limit),
      },
    },
    "Artworks retrieved",
  );
});

// @desc    Get pending artworks (approval queue)
// @route   GET /api/v1/admin/artworks/pending
const getPendingArtworks = catchAsync(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const filter = { approvalStatus: "PENDING_APPROVAL" };

  const [artworks, total] = await Promise.all([
    Artwork.find(filter)
      .sort({ createdAt: 1 }) // الأقدم الأول (FIFO)
      .skip(skip)
      .limit(Number(limit))
      .populate("artist", "name email avatar subscription.plan")
      .lean(),
    Artwork.countDocuments(filter),
  ]);

  return ApiResponse.success(
    res,
    {
      artworks,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        limit: Number(limit),
      },
    },
    "Pending artworks retrieved",
  );
});

// @desc    Approve artwork
// @route   PATCH /api/v1/admin/artworks/:id/approve
const approveArtwork = catchAsync(async (req, res) => {
  const artwork = await Artwork.findById(req.params.id).populate("artist", "name");
  if (!artwork) throw new NotFoundError("Artwork not found");

  if (artwork.approvalStatus === "APPROVED" && artwork.isActive) {
    throw new BadRequestError("اللوحة معتمدة ومفعلة بالفعل");
  }

  artwork.approvalStatus = "APPROVED";
  artwork.isActive = true;
  artwork.reviewedBy = req.user._id;
  artwork.reviewedAt = new Date();
  artwork.adminNote = null;
  await artwork.save();

  eventEmitter.safeEmit("artwork:approved", {
    artistId: artwork.artist._id,
    artworkId: artwork._id,
    title: artwork.title,
  });

  await AuditLog.create([
    {
      admin: req.user._id,
      action: "APPROVE_ARTWORK",
      targetType: "artwork",
      targetId: artwork._id,
      details: { title: artwork.title, artist: artwork.artist?.name },
      ip: req.ip,
    },
  ]);

  return ApiResponse.success(res, artwork, "تم اعتماد اللوحة ونشرها");
});

// @desc    Reject artwork (with reason)
// @route   PATCH /api/v1/admin/artworks/:id/reject
const rejectArtwork = catchAsync(async (req, res) => {
  const { reason } = req.body;
  if (!reason || !reason.trim()) {
    throw new BadRequestError("سبب الرفض مطلوب");
  }

  const artwork = await Artwork.findById(req.params.id).populate("artist", "name");
  if (!artwork) throw new NotFoundError("Artwork not found");

  artwork.approvalStatus = "REJECTED";
  artwork.isActive = false;
  artwork.reviewedBy = req.user._id;
  artwork.reviewedAt = new Date();
  artwork.adminNote = reason.trim();
  await artwork.save();
  eventEmitter.safeEmit(EVENTS.ARTWORK_REJECTED, {
    artistId: artwork.artist._id,
    artworkId: artwork._id,
    title: artwork.title,
    reason,
  });

  await AuditLog.create([
    {
      admin: req.user._id,
      action: "REJECT_ARTWORK",
      targetType: "artwork",
      targetId: artwork._id,
      details: {
        title: artwork.title,
        artist: artwork.artist?.name,
        reason,
      },
      ip: req.ip,
    },
  ]);

  return ApiResponse.success(res, artwork, "تم رفض اللوحة");
});

// @desc    Suspend approved artwork (with reason)
// @route   PATCH /api/v1/admin/artworks/:id/suspend
const suspendArtwork = catchAsync(async (req, res) => {
  const { reason } = req.body;
  if (!reason || !reason.trim()) {
    throw new BadRequestError("سبب الإيقاف مطلوب");
  }

  const artwork = await Artwork.findById(req.params.id).populate("artist", "name");
  if (!artwork) throw new NotFoundError("Artwork not found");

  if (artwork.approvalStatus !== "APPROVED") {
    throw new BadRequestError(
      `لا يمكن إيقاف لوحة حالتها: ${artwork.approvalStatus}. استخدم الرفض أو الـ toggle.`,
    );
  }

  artwork.approvalStatus = "SUSPENDED";
  artwork.isActive = false;
  artwork.reviewedBy = req.user._id;
  artwork.reviewedAt = new Date();
  artwork.adminNote = reason.trim();
  await artwork.save();
  eventEmitter.safeEmit(EVENTS.ARTWORK_SUSPENDED, {
    artistId: artwork.artist._id,
    artworkId: artwork._id,
    title: artwork.title,
    reason,
  });

  await AuditLog.create([
    {
      admin: req.user._id,
      action: "SUSPEND_ARTWORK",
      targetType: "artwork",
      targetId: artwork._id,
      details: {
        title: artwork.title,
        artist: artwork.artist?.name,
        reason,
      },
      ip: req.ip,
    },
  ]);

  return ApiResponse.success(res, artwork, "تم إيقاف اللوحة");
});

// @desc    Unsuspend (re-approve) a suspended artwork
// @route   PATCH /api/v1/admin/artworks/:id/unsuspend
const unsuspendArtwork = catchAsync(async (req, res) => {
  const artwork = await Artwork.findById(req.params.id).populate("artist", "name");
  if (!artwork) throw new NotFoundError("Artwork not found");

  if (artwork.approvalStatus !== "SUSPENDED") {
    throw new BadRequestError("اللوحة ليست موقوفة");
  }

  artwork.approvalStatus = "APPROVED";
  artwork.isActive = true;
  artwork.reviewedBy = req.user._id;
  artwork.reviewedAt = new Date();
  artwork.adminNote = null;
  await artwork.save();

  await AuditLog.create([
    {
      admin: req.user._id,
      action: "UNSUSPEND_ARTWORK",
      targetType: "artwork",
      targetId: artwork._id,
      details: { title: artwork.title, artist: artwork.artist?.name },
      ip: req.ip,
    },
  ]);

  return ApiResponse.success(res, artwork, "تم إعادة تفعيل اللوحة");
});

// @desc    Admin hard-delete (soft if has orders)
// @route   DELETE /api/v1/admin/artworks/:id
const deleteArtworkAdmin = catchAsync(async (req, res) => {
  const artwork = await Artwork.findById(req.params.id).populate("artist", "name");
  if (!artwork) throw new NotFoundError("Artwork not found");

  const ordersCount = await Order.countDocuments({
    "items.artwork": artwork._id,
  });

  if (ordersCount > 0) {
    // Soft delete only
    artwork.isActive = false;
    artwork.approvalStatus = "SUSPENDED";
    artwork.adminNote = "تم الإيقاف بواسطة الأدمن (لها طلبات مرتبطة — لا يمكن حذفها نهائياً)";
    artwork.reviewedBy = req.user._id;
    artwork.reviewedAt = new Date();
    await artwork.save();

    await AuditLog.create([
      {
        admin: req.user._id,
        action: "SOFT_DELETE_ARTWORK",
        targetType: "artwork",
        targetId: artwork._id,
        details: {
          title: artwork.title,
          artist: artwork.artist?.name,
          ordersCount,
          reason: "لها طلبات مرتبطة",
        },
        ip: req.ip,
      },
    ]);

    return ApiResponse.success(
      res,
      { deactivated: true, ordersCount },
      "تم إيقاف اللوحة — لها طلبات مرتبطة فلا يمكن حذفها نهائياً",
    );
  }

  // Hard delete
  await FileUploadService.deleteArtworkImages(artwork._id);
  await Artwork.findByIdAndDelete(artwork._id);

  await AuditLog.create([
    {
      admin: req.user._id,
      action: "HARD_DELETE_ARTWORK",
      targetType: "artwork",
      targetId: artwork._id,
      details: {
        title: artwork.title,
        artist: artwork.artist?.name,
        reason: "حذف نهائي (بلا طلبات)",
      },
      ip: req.ip,
    },
  ]);

  return ApiResponse.success(res, null, "تم حذف اللوحة نهائياً");
});

// ═══════════════════════════════════════════════════
//* Audit Logs
// ═══════════════════════════════════════════════════

// ═══ فئات العمليات للفلترة ═══
const ACTION_CATEGORIES = {
  ban: ["BAN_USER", "UNBAN_USER"],
  withdrawals: [
    "APPROVE_WITHDRAWAL",
    "REJECT_WITHDRAWAL",
    "MARK_WITHDRAWAL_PAID",
  ],
  banks: ["VERIFY_BANK", "REJECT_BANK"],
  orders: ["HOLD_ORDER", "UNHOLD_ORDER", "RELEASE_FUNDS"],
};

// @desc    Get audit logs with filters
// @route   GET /api/v1/admin/audit-logs?category=&search=&from=&to=&page=
const getAuditLogs = catchAsync(async (req, res) => {
  const { category, search, from, to, page = 1, limit = 20 } = req.query;
  const filter = {};

  if (category && ACTION_CATEGORIES[category]) {
    filter.action = { $in: ACTION_CATEGORIES[category] };
  }

  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = end;
    }
  }

  if (search && search.trim()) {
    const q = search.trim();
    const adminMatches = await User.find({
      name: { $regex: q, $options: "i" },
    }).select("_id");
    if (adminMatches.length) {
      filter.admin = { $in: adminMatches.map((u) => u._id) };
    } else {
      filter.admin = null;
    }
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [logs, total] = await Promise.all([
    AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate("admin", "name email"),
    AuditLog.countDocuments(filter),
  ]);

  // ✅ إثراء أسماء الأهداف (لأن targetId بيشير لكولكشنات مختلفة)
  const byType = {};
  logs.forEach((l) => {
    byType[l.targetType] = byType[l.targetType] || [];
    byType[l.targetType].push(l.targetId);
  });

  const [users, orders, ws, bs] = await Promise.all([
    byType.user?.length
      ? User.find({ _id: { $in: byType.user } }).select("name email")
      : Promise.resolve([]),
    byType.order?.length
      ? Order.find({ _id: { $in: byType.order } })
          .select("_id")
          .populate("buyer", "name")
          .populate("artist", "name")
      : Promise.resolve([]),
    byType.withdrawal?.length
      ? Withdrawal.find({ _id: { $in: byType.withdrawal } })
          .select("amount")
          .populate("user", "name")
      : Promise.resolve([]),
    byType.bankAccount?.length
      ? BankAccount.find({ _id: { $in: byType.bankAccount } })
          .select("bankName")
          .populate("user", "name")
      : Promise.resolve([]),
  ]);

  const targetLabels = {};
  users.forEach(
    (u) => (targetLabels[u._id.toString()] = `${u.name} (${u.email})`),
  );
  orders.forEach(
    (o) =>
      (targetLabels[o._id.toString()] =
        `طلب #${o._id.toString().slice(-6).toUpperCase()} · ${o.buyer?.name || "؟"} ← ${o.artist?.name || "؟"}`),
  );
  ws.forEach(
    (w) =>
      (targetLabels[w._id.toString()] =
        `سحب ${w.amount} ر.س · ${w.user?.name || "؟"}`),
  );
  bs.forEach(
    (b) =>
      (targetLabels[b._id.toString()] =
        `${b.bankName} · ${b.user?.name || "؟"}`),
  );

  const result = logs.map((l) => ({
    ...l.toObject(),
    targetLabel:
      targetLabels[l.targetId?.toString()] ||
      `${l.targetType} #${l.targetId?.toString().slice(-6).toUpperCase()}`,
  }));

  return ApiResponse.success(
    res,
    {
      logs: result,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        limit: Number(limit),
      },
    },
    "Audit logs retrieved",
  );
});

module.exports = {
  getAllWithdrawals,
  approveWithdrawal,
  markWithdrawalAsPaid,
  rejectWithdrawal,
  getWithdrawalsSummary,
  holdOrderFunds,
  unholdOrderFunds,
  releaseOrderFunds,
  getAdminStats,
  getFinancialStats,
  getAdminOrders,
  getAdminArtists,
  getPendingBankAccounts,
  verifyBankAccount,
  rejectBankAccount,
  getAdminUsers,
  banUser,
  unbanUser,
  getAdminArtworks,
  getPendingArtworks,
  approveArtwork,
  rejectArtwork,
  suspendArtwork,
  unsuspendArtwork,
  deleteArtworkAdmin,
  getAuditLogs,
};
