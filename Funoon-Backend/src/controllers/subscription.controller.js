

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
// @desc    Purchase a subscription plan
// @route   POST /api/v1/subscriptions/purchase
// @access  Private
const purchaseSubscription = catchAsync(async (req, res, next) => {
  const { planId } = req.body;
  const userId = req.user._id;

  const plan = PLAN_CONFIG[planId];
  if (!plan) throw new BadRequestError("Invalid subscription plan");

  // 1. Check active subscription
  const user = await User.findById(userId);
  if (user.subscription?.isActive && user.subscription.plan === planId) {
    const daysLeft =
      (new Date(user.subscription.endDate) - new Date()) / 86400000;
    if (daysLeft > 30) {
      throw new BadRequestError(
        `Already subscribed. ${Math.ceil(daysLeft)} days remaining.`,
      );
    }
  }

  // 2. Cleanup: expired payments (أكتر من 10 دقايق)
  await SubscriptionPayment.updateMany(
    {
      user: userId,
      plan: planId,
      status: "PENDING",
      createdAt: { $lt: new Date(Date.now() - 10 * 60 * 1000) },
    },
    { $set: { status: "EXPIRED" } },
  );

  // 3. لو فيه pending صالح بـ invoiceId → رجعه
  const existing = await SubscriptionPayment.findOne({
    user: userId,
    plan: planId,
    status: "PENDING",
    moyasarPaymentId: { $ne: null, $exists: true },
    createdAt: { $gt: new Date(Date.now() - 10 * 60 * 1000) },
  });

  if (existing) {
    logger.info(`♻️ Reusing existing payment: ${existing._id}`);
    return ApiResponse.success(
      res,
      {
        paymentUrl: `${process.env.MOYASAR_CHECKOUT_URL || "https://checkout.moyasar.com"}/invoices/${existing.moyasarPaymentId}`,
        invoiceId: existing.moyasarPaymentId,
        planDetails: plan,
        existingPayment: true,
      },
      "Existing payment found",
    );
  }

  // 4. لو فيه pending من غير invoiceId (request تاني لسه شغال) → استنى 3 ثواني
  const inFlight = await SubscriptionPayment.findOne({
    user: userId,
    plan: planId,
    status: "PENDING",
    $or: [{ moyasarPaymentId: null }, { moyasarPaymentId: { $exists: false } }],
    createdAt: { $gt: new Date(Date.now() - 10 * 60 * 1000) },
  });

  if (inFlight) {
    await new Promise((r) => setTimeout(r, 3000));
    const refreshed = await SubscriptionPayment.findById(inFlight._id);
    if (refreshed?.moyasarPaymentId) {
      logger.info(`♻️ Reusing payment after wait: ${refreshed._id}`);
      return ApiResponse.success(
        res,
        {
          paymentUrl: `${process.env.MOYASAR_CHECKOUT_URL || "https://checkout.moyasar.com"}/invoices/${refreshed.moyasarPaymentId}`,
          invoiceId: refreshed.moyasarPaymentId,
          planDetails: plan,
          existingPayment: true,
        },
        "Existing payment found",
      );
    }
    // الأول فشل → كمّل عادي
    refreshed.status = "EXPIRED";
    await refreshed.save();
  }

  // 5. اعمل subPayment جديد
  const subPayment = await SubscriptionPayment.create({
    user: userId,
    plan: planId,
    amount: plan.price,
    amountInHalalas: plan.price * 100,
    status: "PENDING",
    expiresAt: new Date(Date.now() + 30 * 60 * 1000),
  });

  // 6. Moyasar invoice (الـ Idempotency-Key بيحمي من الـ duplicates)
  let invoice;
  try {
    invoice = await MoyasarService.createInvoice({
      amount: plan.price * 100,
      description: `Funoon.sa - ${plan.label} Subscription`,
      callbackUrl: `${process.env.NGROK_URL}/api/v1/webhooks/moyasar`,
      successUrl: `${process.env.FRONTEND_URL}/subscription/success`,
      backUrl: `${process.env.FRONTEND_URL}/subscription/cancel`,
      metadata: {
        type: "subscription",
        subscriptionPaymentId: subPayment._id.toString(),
        userId: userId.toString(),
        planId,
      },
    });
    if (!invoice?.id) throw new Error("Invalid invoice");
  } catch (error) {
    logger.error("❌ Moyasar invoice failed:", error.message);
    subPayment.status = "FAILED";
    subPayment.failureReason = error.message;
    await subPayment.save();
    throw new BadRequestError("تعذّر بدء عملية الدفع. حاول مرة أخرى.");
  }

  subPayment.moyasarPaymentId = invoice.id;
  await subPayment.save();

  return ApiResponse.success(
    res,
    {
      paymentUrl: invoice.url,
      invoiceId: invoice.id,
      planDetails: plan,
    },
    "Subscription invoice created",
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
  let event;
  if (
    typeof req.body === "object" &&
    req.body !== null &&
    !Buffer.isBuffer(req.body)
  ) {
    event = req.body; // Already parsed ✅
  } else {
    try {
      const bodyString =
        typeof req.body === "string" ? req.body : req.body.toString("utf8");
      event = JSON.parse(bodyString);
    } catch (err) {
      logger.error("❌ Subscription webhook parse error:", err.message);
      return res.status(400).json({ error: "Invalid JSON" });
    }
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
    user.role = "artist"; 
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
