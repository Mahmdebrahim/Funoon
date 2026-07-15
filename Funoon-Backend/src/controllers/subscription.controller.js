// src/controllers/subscription.controller.js
const mongoose = require("mongoose");
const User = require("../models/User");
const Wallet = require("../models/Wallet");
const SubscriptionPayment = require("../models/SubscriptionPayment");
const MoyasarService = require("../services/payment/moyasar.service");
const { PLAN_CONFIG } = require("../models/User");
const { BadRequestError, NotFoundError } = require("../utils/api-error");
const ApiResponse = require("../utils/api-response");
const catchAsync = require("../utils/catch-async");
const logger = require("../utils/logger");

// @desc    Purchase a subscription plan
// @route   POST /api/v1/subscriptions/purchase
// @access  Private
const purchaseSubscription = catchAsync(async (req, res, next) => {
  const { planId } = req.body;
  const userId = req.user._id;

  // 1. Validate Plan
  const plan = PLAN_CONFIG[planId];
  if (!plan) {
    throw new BadRequestError("Invalid subscription plan");
  }

  // 2. Check if already active (same plan, not expiring soon)
  const user = await User.findById(userId);
  if (user.subscription?.isActive && user.subscription.plan === planId) {
    const endDate = new Date(user.subscription.endDate);
    const now = new Date();
    const daysLeft = (endDate - now) / (1000 * 60 * 60 * 24);

    if (daysLeft > 30) {
      throw new BadRequestError(
        `You already have an active ${plan.label} subscription. ${Math.ceil(daysLeft)} days remaining.`,
      );
    }
  }

  // 3. Check for pending payment (idempotency)
  const pendingPayment = await SubscriptionPayment.findOne({
    user: userId,
    plan: planId,
    status: "PENDING",
    expiresAt: { $gt: new Date() },
  });

  if (pendingPayment) {
    return ApiResponse.success(
      res,
      {
        paymentUrl: `${process.env.MOYASAR_CHECKOUT_URL || "https://checkout.moyasar.com"}/invoices/${pendingPayment.moyasarPaymentId}`,
        invoiceId: pendingPayment.moyasarPaymentId,
        planDetails: plan,
        existingPayment: true,
      },
      "Existing payment found. Please complete it.",
    );
  }

  // 4. Create SubscriptionPayment record (Pending)
  const subPayment = await SubscriptionPayment.create({
    user: userId,
    plan: planId,
    amount: plan.price,
    amountInHalalas: plan.price * 100,
    status: "PENDING",
  });

  // 5. Create Moyasar Invoice
  const invoiceData = {
    amount: plan.price * 100, // بالهللات
    description: `Funoon.sa - ${plan.label} Subscription (${plan.durationMonths} Months)`,
    callbackUrl: `${process.env.NGROK_URL}/api/v1/webhooks/moyasar`,
    successUrl: `${process.env.FRONTEND_URL}/subscription/success`,
    backUrl: `${process.env.FRONTEND_URL}/subscription/cancel`,
    metadata: {
      type: "subscription", // ✅ مهم للـ Webhook
      subscriptionPaymentId: subPayment._id.toString(),
      userId: userId.toString(),
      planId: planId,
    },
  };

  const invoice = await MoyasarService.createInvoice(invoiceData);

  // 6. Save Invoice ID
  subPayment.moyasarPaymentId = invoice.id;
  await subPayment.save();

  return ApiResponse.success(
    res,
    {
      paymentUrl: invoice.url,
      invoiceId: invoice.id,
      planDetails: plan,
    },
    "Subscription invoice created. Please complete payment.",
  );
});

// @desc    Get my subscription details
// @route   GET /api/v1/subscriptions/my
// @access  Private
const getMySubscription = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  const plan = PLAN_CONFIG[user.subscription?.plan];

  return ApiResponse.success(
    res,
    {
      subscription: {
        plan: user.subscription?.plan || "none",
        label: plan?.label || "No Plan",
        startDate: user.subscription?.startDate,
        endDate: user.subscription?.endDate,
        isActive: user.hasActiveSubscription(),
        pricePaid: user.subscription?.pricePaid,
        autoRenew: user.subscription?.autoRenew,
        features: plan?.features || {},
        maxArtworks: plan?.maxArtworks || 0,
        commission: plan?.commission || 0.15,
      },
    },
    "Subscription details retrieved",
  );
});

// @desc    Get my subscription payment history
// @route   GET /api/v1/subscriptions/my/payments
// @access  Private
const getMySubscriptionPayments = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const payments = await SubscriptionPayment.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  const total = await SubscriptionPayment.countDocuments({
    user: req.user._id,
  });

  return ApiResponse.success(
    res,
    {
      payments,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
      },
    },
    "Subscription payments retrieved",
  );
});

// @desc    Handle Moyasar webhook for subscription payments
// @route   POST /api/v1/webhooks/moyasar/subscription
// @access  Public (Moyasar server)
const handleSubscriptionWebhook = catchAsync(async (req, res, next) => {
  const rawBody = req.body;

  let event;
  try {
    const bodyString =
      typeof rawBody === "string" ? rawBody : rawBody.toString("utf8");
    event = JSON.parse(bodyString);
  } catch (err) {
    logger.error("❌ Subscription webhook parse error:", err.message);
    return res.status(400).json({ error: "Invalid JSON" });
  }

  logger.info("📥 Subscription webhook received, status:", event.status);

  // Check if payment is paid
  if (event.status !== "paid") {
    logger.info("⚠️ Ignoring non-paid event, status:", event.status);
    return res.status(200).json({ received: true });
  }

  const metadata = event.metadata || {};
  logger.info("📦 Metadata:", metadata);

  if (metadata.type !== "subscription") {
    logger.info("⚠️ Not a subscription payment");
    return res.status(200).json({ received: true });
  }

  const { subscriptionPaymentId, userId, planId } = metadata;
  const plan = PLAN_CONFIG[planId];

  if (!plan) {
    logger.error("❌ Invalid plan in metadata:", planId);
    return res.status(200).json({ received: true });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Update SubscriptionPayment status
    const subPayment = await SubscriptionPayment.findByIdAndUpdate(
      subscriptionPaymentId,
      {
        status: "PAID",
        moyasarPaymentStatus: event.status,
        moyasarPaymentId: event.id,
        paidAt: new Date(),
      },
      { session, new: true },
    );

    if (!subPayment) {
      logger.error("❌ SubscriptionPayment not found:", subscriptionPaymentId);
      await session.abortTransaction();
      session.endSession();
      return res.status(200).json({ received: true });
    }

    // 2. Idempotency check
    const user = await User.findById(userId).session(session);
    if (!user) {
      logger.error("❌ User not found:", userId);
      await session.abortTransaction();
      session.endSession();
      return res.status(200).json({ received: true });
    }

    // 3. Calculate new dates
    const now = new Date();
    const endDate = new Date(now);
    endDate.setMonth(endDate.getMonth() + plan.durationMonths);

    // 4. Update User (Role & Subscription)
    user.role = "artist"; // ✅ ترقية تلقائية
    user.subscription = {
      plan: planId,
      startDate: now,
      endDate: endDate,
      isActive: true,
      pricePaid: plan.price,
      moyasarPaymentId: event.id,
      moyasarPaymentStatus: event.status,
      autoRenew: true,
      reminderSent: false,
    };
    await user.save({ session });

    // 5. Create Wallet for the new artist (if not exists)
    let wallet = await Wallet.findOne({ user: userId }).session(session);
    if (!wallet) {
      await Wallet.create([{ user: userId }], { session });
      logger.info("✅ Created new wallet for artist:", userId);
    }

    await session.commitTransaction();
    session.endSession();

    // TODO: Send Welcome Email & Notification
    logger.info(
      `✅ Subscription activated for user ${userId}, plan: ${planId}`,
    );

    return res.status(200).json({ received: true });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    logger.error("❌ Subscription webhook error:", error);
    return res.status(200).json({ received: true, error: error.message });
  }
});

module.exports = {
  purchaseSubscription,
  getMySubscription,
  getMySubscriptionPayments,
  handleSubscriptionWebhook,
};
