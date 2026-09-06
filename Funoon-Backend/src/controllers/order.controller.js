// src/controllers/order.controller.js
const mongoose = require("mongoose");
const Cart = require("../models/Cart");
const Order = require("../models/Order");
const Artwork = require("../models/Artwork");
const User = require("../models/User");
const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");
const MoyasarService = require("../services/payment/moyasar.service");
const OTOService = require("../services/shipping/oto.service");
const logger = require("../utils/logger");
const {
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
} = require("../utils/api-error");
const ApiResponse = require("../utils/api-response");
const catchAsync = require("../utils/catch-async");

const otoService = OTOService;

/**
 * ✅ Helper function: فلترة خيارات الشحن من OTO
 * - استبعاد PUDO (pickupByCustomer) - العميل مش هيرفع ياخد من فرع
 * - استبعاد dropoffOnly - الفنان مش هيرفع يودّي للفرع
 * - لازم يوصل لحد البيت (toCustomerDoorstep)
 * - لازم الشركة بتيجي تاخد من الفنان (freePickup أو freePickupDropoff)
 */
const filterShippingOptions = (deliveryOptions = [], artworkPrice = null) => {
  return (deliveryOptions || []).filter((opt) => {
    if (opt.deliveryType === "pickupByCustomer") return false;
    if (opt.pickupDropoff === "dropoffOnly") return false;
    if (opt.deliveryType !== "toCustomerDoorstep") return false;
    if (
      opt.pickupDropoff !== "freePickup" &&
      opt.pickupDropoff !== "freePickupDropoff"
    ) {
      return false;
    }

    // ✅ جديد: استبعاد شركات الشحن اللي قيمة اللوحة أكبر من حد التأمين بتاعها
    if (
      artworkPrice != null &&
      opt.maxOrderValue &&
      artworkPrice > opt.maxOrderValue
    ) {
      logger.info(
        `🚫 Excluding ${opt.deliveryCompanyName}: maxOrderValue ${opt.maxOrderValue} < artworkPrice ${artworkPrice}`,
      );
      return false;
    }

    return true;
  });
};

/**
 * Helper function: اختيار أرخص خيار صالح
 */
const selectCheapestOption = (validOptions) => {
  if (!validOptions || validOptions.length === 0) return null;

  return validOptions.reduce((min, opt) => (opt.price < min.price ? opt : min));
};

// ═══════════════════════════════════════════════════
// Prestige Free Shipping Quota — أول 10 طلبات/سنة بس
// ═══════════════════════════════════════════════════
const checkFreeShippingQuota = async (artist) => {
  if (artist.subscription?.plan !== "opal_prestige") return false;

  const quotaLimit = User.PLAN_CONFIG?.opal_prestige?.freeShippingQuota ?? 10;

  // بداية سنة الاشتراك الحالية (الـ quota بتتجدد مع كل تجديد)
  const quotaStart = artist.subscription?.startDate
    ? new Date(artist.subscription.startDate)
    : new Date(0);

  // عدد الطلبات اللي المنصة غطت شحنها من بداية الاشتراك
  const used = await Order.countDocuments({
    artist: artist._id,
    status: { $in: ["PAID", "PROCESSING", "SHIPPED", "DELIVERED", "COMPLETED"] },
    "financials.platformShippingExpense": { $gt: 0 },
    createdAt: { $gte: quotaStart },
  });

  return used < quotaLimit;
};

// @desc    Checkout - Create orders from cart and initiate payment
// @route   POST /api/v1/orders/checkout
// @access  Private (Buyer only)
const checkout = catchAsync(async (req, res, next) => {
  const buyer = req.user;
  const { paymentMethod = "creditcard" } = req.body;

  // 1. Get cart
  let cart = await Cart.findOne({ user: buyer._id });
  if (!cart || cart.items.length === 0) {
    throw new BadRequestError("Cart is empty");
  }

  // 2. Clean invalid items
  await cart.cleanInvalidItems();
  if (cart.items.length === 0) {
    throw new BadRequestError("Cart is empty after cleaning invalid items");
  }

  // 3. Populate all data
  await cart.populate([
    { path: "items.artwork" },
    {
      path: "items.artist",
      select: "name email subscription address phone isBanned",
    },
  ]);

  // ✅ 4. Check for existing PENDING_PAYMENT orders (prevent duplicates)
  const existingPendingOrders = await Order.find({
    buyer: buyer._id,
    status: "PENDING_PAYMENT",
    createdAt: { $gt: new Date(Date.now() - 60 * 60 * 1000) },
  }).populate(
    "items.artwork",
    "title isSold isActive reservedBy reservedUntil",
  );

  if (existingPendingOrders.length > 0) {
    const existingOrder = existingPendingOrders[0];

    let allAvailable = true;
    for (const item of existingOrder.items) {
      const artwork = item.artwork;
      if (!artwork || artwork.isSold || !artwork.isActive) {
        allAvailable = false;
        break;
      }
      // محجوزة لحد تاني والـ hold لسه active؟
      if (
        artwork.reservedBy &&
        artwork.reservedBy.toString() !== buyer._id.toString() &&
        artwork.reservedUntil > new Date()
      ) {
        allAvailable = false;
        break;
      }
    }

    const artistIds = [
      ...new Set(
        existingOrder.items.map((i) => i.artwork?.artist).filter(Boolean),
      ),
    ];

    const bannedArtists = await User.find({
      _id: { $in: artistIds },
      isBanned: true,
    }).select("_id");

    if (bannedArtists.length > 0) {
      logger.warn(`⚠️ Reuse blocked: artist(s) banned since original order`);
    } else if (allAvailable && existingOrder.payment?.invoiceId) {
      try {
        const invoice = await MoyasarService.fetchInvoice(
          existingOrder.payment.invoiceId,
        );

        if (invoice.status === "initiated" || invoice.status === "pending") {
          logger.info(
            `♻️ Reusing existing pending order: ${existingOrder._id}`,
          );

          return ApiResponse.success(
            res,
            {
              orders: existingPendingOrders.map((o) => ({
                _id: o._id,
                artist: o.artist,
                totalAmount: o.financials.totalAmount,
                items: o.items.length,
                shipping: {
                  deliveryCompanyName: o.shipping?.deliveryCompanyName,
                  deliveryOptionName: o.shipping?.deliveryOptionName,
                  avgDeliveryTime: o.shipping?.avgDeliveryTime,
                  logo: o.shipping?.logo,
                },
              })),
              paymentUrl: invoice.url,
              invoiceId: invoice.id,
              grandTotal: existingPendingOrders.reduce(
                (sum, o) => sum + o.financials.totalAmount,
                0,
              ),
            },
            "Existing pending order found",
          );
        }
      } catch (err) {
        logger.warn("Existing invoice invalid or expired, creating new orders");
      }
    }

    // Cancel invoices + cancel orders
    for (const order of existingPendingOrders) {
      if (order.payment?.invoiceId) {
        try {
          await MoyasarService.cancelInvoice(order.payment.invoiceId);
        } catch (err) {
          logger.warn(
            `Failed to cancel invoice ${order.payment.invoiceId} (likely already expired/terminal): ${err.message}`,
          );
        }
      }
    }
    await Order.updateMany(
      { _id: { $in: existingPendingOrders.map((o) => o._id) } },
      {
        $set: {
          status: "CANCELLED",
          cancelledAt: new Date(),
          cancellationReason: "expired_pending_order",
        },
      },
    );
    logger.info(
      `🗑️ Cancelled ${existingPendingOrders.length} expired pending orders + invoices`,
    );
  }

  // 5. Validate all items and group by artist
  const ordersByArtist = new Map();
  // Cache للـ quota عشان منعملش query لكل لوحة
  const quotaCache = new Map();

  for (const item of cart.items) {
    const artwork = item.artwork;
    const artist = item.artist;

    if (!artwork || !artwork.isActive || artwork.isSold) {
      throw new BadRequestError(
        `Artwork "${artwork?.title}" is no longer available`,
      );
    }

    if (!artist || !artist.hasActiveSubscription()) {
      throw new BadRequestError(
        `Artist "${artist?.name}" does not have an active subscription`,
      );
    }
    if (artist.isBanned) {
      throw new BadRequestError(
        `أحد الأعمال في سلتك لفنان محظور ولم يعد متاحاً للشراء`,
      );
    }

    const commissionRate = artist.getCommissionRate();
    const artistPlan = artist.subscription.plan;

    const artworkPrice = artwork.price;

    let shippingCost = 0;
    let selectedOption = null;

    try {
      const originCity = artist.address?.city || "Riyadh";
      const destinationCity = buyer.address?.city || "Riyadh";

      const otoResponse = await otoService.checkOTODeliveryFee({
        originCity,
        destinationCity,
        weight: artwork.weight || 2,
        length: artwork.dimensions?.width || 60,
        width: artwork.dimensions?.height || 80,
        height: artwork.dimensions?.depth || 3,
        shippingType: artwork.shippingType || "standard",
      });

      const allOptions = otoResponse.deliveryCompany || [];

      // ✅ الآن artworkPrice معرف وممكن نمرره safely
      const validOptions = filterShippingOptions(allOptions, artworkPrice);
      selectedOption = selectCheapestOption(validOptions);

      if (selectedOption) {
        shippingCost = selectedOption.price;
      } else {
        const fallbackOption = selectCheapestOption(allOptions);
        if (fallbackOption) {
          selectedOption = fallbackOption;
          shippingCost = fallbackOption.price;
        } else {
          shippingCost = 25;
        }
      }
    } catch (error) {
      logger.error("❌ OTO shipping calculation error:", error.message);
      shippingCost = 25;
    }

    // 🧪🧪🧪 TESTING ONLY — ثابت على SMSA Same Day (secom) 🧪🧪🧪
    selectedOption = {
      deliveryOptionId: 56469,
      deliveryCompanyName: "secom",
      deliveryOptionName: "SMSA Same Day",
      price: 25,
      avgDeliveryTime: "1to4WorkingDays",
      pickupDropoff: "freePickupDropoff",
      deliveryType: "toCustomerDoorstep",
      serviceType: "sameDay",
      maxOrderValue: 5000,
      logo: "https://storage.googleapis.com/tryoto-public/delivery-logo/smsav2.png",
    };
    shippingCost = 25;
    // 🧪🧪🧪 نهاية جزء الاختبار 🧪🧪🧪

    // شيك على الـ quota (مرة واحدة لكل فنان)
    if (!quotaCache.has(artist._id.toString())) {
      quotaCache.set(
        artist._id.toString(),
        await checkFreeShippingQuota(artist),
      );
    }
    const hasQuotaLeft = quotaCache.get(artist._id.toString());

    // المنصة بتغطي الشحن بس لو: Prestige + standard + لسه فيه quota
    const platformShippingExpense =
      artistPlan === "opal_prestige" &&
      artwork.shippingType === "standard" &&
      hasQuotaLeft
        ? shippingCost
        : 0;

    const buyerPaysShipping = platformShippingExpense === 0 ? shippingCost : 0;

    // const artworkPrice = artwork.price;
    const platformCommission =
      Math.round(artworkPrice * commissionRate * 100) / 100;
    const artistEarning = artworkPrice - platformCommission;

    if (!ordersByArtist.has(artist._id.toString())) {
      ordersByArtist.set(artist._id.toString(), {
        buyer: buyer._id,
        artist: artist._id,
        items: [],
        financials: {
          subtotal: 0,
          shippingCost: 0,
          totalCommission: 0,
          totalArtistEarning: 0,
          totalAmount: 0,
          currency: "SAR",
          platformShippingExpense: 0,
        },
        shipping: {
          deliveryOptionId: selectedOption?.deliveryOptionId || null,
          deliveryCompanyName: selectedOption?.deliveryCompanyName || null,
          deliveryOptionName: selectedOption?.deliveryOptionName || null,
          avgDeliveryTime: selectedOption?.avgDeliveryTime || null,
          pickupCutOffTime: selectedOption?.pickupCutOffTime || null, // ✅ جديد
          maxFreeWeight: selectedOption?.maxFreeWeight || null, // ✅ جديد
          extraWeightPerKg: selectedOption?.extraWeightPerKg || null, // ✅ جديد
          returnFee: selectedOption?.returnFee || null, // ✅ جديد
          pickupDropoff: selectedOption?.pickupDropoff || null,
          deliveryType: selectedOption?.deliveryType || null,
          serviceType: selectedOption?.serviceType || null,
          logo: selectedOption?.logo || null,
          buyerAddress: {
            name: buyer.name,
            phone: buyer.phone,
            street: buyer.address?.street || "",
            city: buyer.address?.city || "",
            district: buyer.address?.district || "",
            zipCode: buyer.address?.zipCode || "",
            country: buyer.address?.country || "SA",
            buildingNo: buyer.address?.buildingNo || "",
            shortAddressCode: buyer.address?.shortAddressCode || "",
            lat: buyer.address?.lat || "",
            lon: buyer.address?.lon || "",
          },
          artistAddress: {
            name: artist.name,
            phone: artist.phone,
            street: artist.address?.street || "",
            city: artist.address?.city || "",
            district: artist.address?.district || "",
            zipCode: artist.address?.zipCode || "",
            country: artist.address?.country || "SA",
            buildingNo: artist.address?.buildingNo || "",
            shortAddressCode: artist.address?.shortAddressCode || "",
            lat: artist.address?.lat || "",
            lon: artist.address?.lon || "",
          },
        },
      });
    }

    const orderData = ordersByArtist.get(artist._id.toString());

    orderData.items.push({
      artwork: artwork._id,
      artworkSnapshot: {
        title: artwork.title,
        coverImage: artwork.coverImage,
        price: artworkPrice,
        dimensions: artwork.dimensions,
        shippingType: artwork.shippingType,
      },
      financials: {
        artworkPrice,
        commissionRate,
        platformCommission,
        artistEarning,
      },
    });

    orderData.financials.subtotal += artworkPrice;
    orderData.financials.shippingCost += buyerPaysShipping;
    orderData.financials.totalCommission += platformCommission;
    orderData.financials.totalArtistEarning += artistEarning;
    orderData.financials.totalAmount += artworkPrice + buyerPaysShipping;
    orderData.financials.platformShippingExpense += platformShippingExpense;
  }

  // Create orders
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const HOLD_DURATION = 30 * 60 * 1000;

    for (const orderData of ordersByArtist.values()) {
      for (const item of orderData.items) {
        const reservedArtwork = await Artwork.findOneAndUpdate(
          {
            _id: item.artwork,
            isActive: true,
            isSold: false,
            $or: [
              { reservedBy: null },
              { reservedUntil: { $lt: new Date() } },
              { reservedBy: buyer._id },
            ],
          },
          {
            reservedBy: buyer._id,
            reservedUntil: new Date(Date.now() + HOLD_DURATION),
          },
          { new: true, session },
        );

        if (!reservedArtwork) {
          throw new BadRequestError(
            `للأسف، لوحة "${item.artworkSnapshot?.title || "فنية"}" محجوزة لمشترٍ آخر أو لم تعد متاحة.`,
          );
        }
      }
    }

    const orders = [];

    for (const orderData of ordersByArtist.values()) {
      const order = await Order.create([orderData], { session });
      orders.push(order[0]);
    }

    const grandTotal = orders.reduce(
      (sum, order) => sum + order.financials.totalAmount,
      0,
    );

    const invoiceData = {
      amount: grandTotal * 100,
      description: `Funoon.sa - ${orders.length} artwork(s)`,
      callbackUrl: `${process.env.NGROK_URL}/api/v1/webhooks/moyasar`,
      successUrl: `${process.env.FRONTEND_URL}/payment/success`,
      backUrl: `${process.env.FRONTEND_URL}/payment/cancel`,
      expired_at: new Date(Date.now() + HOLD_DURATION).toISOString(),
      metadata: {
        orderIds: orders.map((o) => o._id.toString()).join(","),
        buyerId: buyer._id.toString(),
        type: "artwork_purchase",
      },
    };

    const moyasarInvoice = await MoyasarService.createInvoice(invoiceData);

    for (const order of orders) {
      order.payment.invoiceId = moyasarInvoice.id;
      order.payment.method = paymentMethod;
      await order.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    return ApiResponse.success(
      res,
      {
        orders: orders.map((o) => ({
          _id: o._id,
          artist: o.artist,
          totalAmount: o.financials.totalAmount,
          items: o.items.length,
          shipping: {
            deliveryCompanyName: o.shipping?.deliveryCompanyName,
            deliveryOptionName: o.shipping?.deliveryOptionName,
            avgDeliveryTime: o.shipping?.avgDeliveryTime,
            logo: o.shipping?.logo,
          },
        })),
        paymentUrl: moyasarInvoice.url,
        invoiceId: moyasarInvoice.id,
        grandTotal,
      },
      "Checkout initiated successfully",
    );
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();

    // ✅ WriteConflict → user-friendly error (اللوحة محجوزة لحد تاني)
    const isWriteConflict =
      error?.codeName === "WriteConflict" ||
      error?.code === 112 ||
      error?.errorLabels?.includes?.("TransientTransactionError") ||
      error?.hasErrorLabel?.("TransientTransactionError") ||
      /write conflict/i.test(error?.message || "");

    if (isWriteConflict) {
      logger.warn(
        "⚠️ Checkout WriteConflict — artwork reserved by another buyer",
      );
      throw new BadRequestError(
        "للأسف، إحدى اللوحات في سلتك تم حجزها لمشترٍ آخر للتو. يرجى المحاولة مرة أخرى أو اختيار لوحة أخرى.",
      );
    }

    logger.error("Checkout error:", error);
    throw error;
  }
});

// @desc    Moyasar webhook handler
// @route   POST /api/v1/webhooks/moyasar
// @access  Public (Moyasar server)
const handleMoyasarWebhook = catchAsync(async (req, res, next) => {
  console.log("📥 Moyasar Webhook received");

  // ✅ تعامل مع كل أنواع req.body (Buffer / Object / String)
  let event;
  try {
    if (Buffer.isBuffer(req.body)) {
      // ✅ الحالة 1: Buffer (من express.raw)
      const bodyString = req.body.toString("utf8");
      event = JSON.parse(bodyString);
    } else if (typeof req.body === "string") {
      // ✅ الحالة 2: String (من express.text)
      event = JSON.parse(req.body);
    } else if (typeof req.body === "object" && req.body !== null) {
      // ✅ الحالة 3: Object (من express.json)
      event = req.body;
    } else {
      throw new Error("Unknown body type");
    }

    console.log("✅ Parsed event, id:", event.id, "status:", event.status);
  } catch (err) {
    console.error("❌ Parse error:", err.message);
    console.error("   Body type:", typeof req.body);
    console.error("   Is Buffer:", Buffer.isBuffer(req.body));
    console.error("   Raw body:", req.body);
    return res.status(400).json({ error: "Invalid JSON" });
  }

  // ✅ تحقق إن الـ status هو "paid"
  if (event.status !== "paid") {
    console.log("⚠️ Ignoring non-paid event, status:", event.status);
    return res.status(200).json({ received: true });
  }

  const metadata = event.metadata || {};
  console.log("📦 Metadata:", metadata);

  // ✅ Subscription webhook (لو موجود)
  if (metadata.type === "subscription") {
    console.log("🔄 Processing subscription webhook...");
    const { handleSubscriptionWebhook } = require("./subscription.controller");
    return handleSubscriptionWebhook(req, res, next);
  }

  if (metadata.type !== "artwork_purchase") {
    console.log("⚠️ Not an artwork purchase");
    return res.status(200).json({ received: true });
  }

  // ✅ استخراج orderIds
  let orderIds = metadata.orderIds ? metadata.orderIds.split(",") : [];

  if (orderIds.length === 0) {
    const invoiceId = event.id;
    console.log(
      "🔍 No orderIds in metadata, searching by invoiceId:",
      invoiceId,
    );

    const orders = await Order.find({ "payment.invoiceId": invoiceId });
    orderIds = orders.map((o) => o._id.toString());

    if (orderIds.length === 0) {
      console.error("❌ No orders found for invoiceId:", invoiceId);
      return res.status(200).json({ received: true });
    }

    console.log("✅ Found orders by invoiceId:", orderIds);
  }

  console.log("🔢 Order IDs to process:", orderIds);

  // ✅ Idempotency check: skip orders already PAID
  const existingOrders = await Order.find({
    _id: { $in: orderIds },
    status: "PAID",
  });

  if (existingOrders.length === orderIds.length) {
    console.log("⚠️ All orders already processed (idempotent response)");
    return res.status(200).json({ received: true });
  }

  // ═══════════════════════════════════════════════════
  // حماية من البان — فحص المشتري والفنانين
  // ═══════════════════════════════════════════════════
  const pendingOrdersForCheck = await Order.find({
    _id: { $in: orderIds },
    status: "PENDING_PAYMENT",
  })
    .populate("artist", "isBanned name")
    .populate("buyer", "isBanned name");

  // 1. فحص المشتري
  const bannedBuyer = pendingOrdersForCheck.find((o) => o.buyer?.isBanned);
  if (bannedBuyer) {
    logger.warn(
      `🚫 Moyasar webhook blocked: buyer ${bannedBuyer.buyer._id} (${bannedBuyer.buyer.name}) is banned`,
    );

    const paymentIdForRefund = event.payments?.[0]?.id;
    if (paymentIdForRefund) {
      try {
        const totalAmount = pendingOrdersForCheck.reduce(
          (sum, o) => sum + o.financials.totalAmount,
          0,
        );
        await MoyasarService.refundPayment(paymentIdForRefund, {
          amount: totalAmount,
          reason: "Buyer account banned before payment completion",
        });
        logger.info(`✅ Refund initiated for banned buyer: ${totalAmount} SAR`);
      } catch (refundErr) {
        logger.error(`❌ Refund failed for banned buyer:`, refundErr.message);
      }
    }

    // Cancel كل الـ orders
    await Order.updateMany(
      { _id: { $in: orderIds }, status: "PENDING_PAYMENT" },
      {
        $set: {
          status: "CANCELLED",
          cancellationReason: "buyer_banned_before_payment",
          cancelledAt: new Date(),
        },
      },
    );

    await Artwork.updateMany(
      { reservedBy: { $in: pendingOrdersForCheck.map((o) => o.buyer) } },
      { $set: { reservedBy: null, reservedUntil: null } },
    );

    return res.status(200).json({ received: true, blocked: "banned_buyer" });
  }

  // 2. فحص الفنانين
  const bannedArtists = pendingOrdersForCheck.filter((o) => o.artist?.isBanned);
  if (bannedArtists.length > 0) {
    const bannedArtistIds = [
      ...new Set(bannedArtists.map((o) => o.artist._id.toString())),
    ];
    logger.warn(
      `🚫 Moyasar webhook blocked: ${bannedArtists.length} order(s) for banned artist(s): ${bannedArtistIds.join(", ")}`,
    );

    // Refund كامل
    const paymentIdForRefund = event.payments?.[0]?.id;
    if (paymentIdForRefund) {
      try {
        const totalAmount = pendingOrdersForCheck.reduce(
          (sum, o) => sum + o.financials.totalAmount,
          0,
        );
        await MoyasarService.refundPayment(paymentIdForRefund, {
          amount: totalAmount,
          reason: "Artist account(s) banned before payment completion",
        });
        logger.info(
          `✅ Refund initiated for banned artist(s): ${totalAmount} SAR`,
        );
      } catch (refundErr) {
        logger.error(
          `❌ Refund failed for banned artist(s):`,
          refundErr.message,
        );
      }
    }

    // Cancel كل الـ orders
    await Order.updateMany(
      { _id: { $in: orderIds }, status: "PENDING_PAYMENT" },
      {
        $set: {
          status: "CANCELLED",
          cancellationReason: "artist_banned_before_payment",
          cancelledAt: new Date(),
        },
      },
    );

    // حرّر الـ reserved artworks
    await Artwork.updateMany(
      { reservedBy: { $in: pendingOrdersForCheck.map((o) => o.buyer) } },
      { $set: { reservedBy: null, reservedUntil: null } },
    );

    return res.status(200).json({ received: true, blocked: "banned_artist" });
  }
  // ═══════════════════════════════════════════════════
  // نهاية حماية البان
  // ═══════════════════════════════════════════════════

  // ✅ Transaction للمعاملات المالية
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    console.log("🔄 Processing orders...");

    const processedOrders = [];
    const paymentId = event.payments?.[0]?.id || null;

    for (const orderId of orderIds) {
      // ─── 1. نجيب الـ order ───
      const pendingOrder = await Order.findOne({
        _id: orderId,
        status: "PENDING_PAYMENT",
      }).session(session);

      if (!pendingOrder) {
        console.log(
          "⚠️ Skipping order (not found or not PENDING_PAYMENT):",
          orderId,
        );
        continue;
      }

      // ─── 2. Atomic sold + hold cleanup ───
      let allSold = true;
      let soldArtworkTitle = null;

      for (const item of pendingOrder.items) {
        // ✅ Atomic: check (isSold=false) + update (isSold=true) + hold cleanup
        const artwork = await Artwork.findOneAndUpdate(
          {
            _id: item.artwork,
            isSold: false,
            isActive: true,
            $or: [
              { reservedBy: pendingOrder.buyer },
              { reservedBy: null },
              { reservedUntil: { $lt: new Date() } },
            ],
          },
          { isSold: true, reservedBy: null, reservedUntil: null, isFeatured: false, featuredAt: null },
          { new: true, session },
        );

        if (!artwork) {
          // 💥 اللوحة already sold → cancel + refund
          allSold = false;
          soldArtworkTitle = item.artworkSnapshot?.title || "Unknown";
          break;
        }

        console.log("✅ Artwork sold (atomic) + hold cleared:", item.artwork);

        // ✅ Cart cleanup: نشيل اللوحة من كل الـ carts
        await Cart.updateMany(
          { "items.artwork": item.artwork },
          { $pull: { items: { artwork: item.artwork } } },
          { session },
        );
      }

      // ─── 3. لو أي artwork sold → cancel + refund ───
      if (!allSold) {
        console.log(
          `⚠️ Order ${orderId}: artwork "${soldArtworkTitle}" already sold — auto-cancelling`,
        );

        await Order.findOneAndUpdate(
          { _id: orderId, status: "PENDING_PAYMENT" },
          {
            $set: {
              status: "CANCELLED",
              cancellationReason: `auto_cancelled: artwork "${soldArtworkTitle}" sold to another buyer`,
              cancelledAt: new Date(),
            },
          },
          { session },
        );

        // Refund
        const paymentIdForRefund = event.payments?.[0]?.id;
        if (paymentIdForRefund) {
          try {
            await MoyasarService.refundPayment(paymentIdForRefund, {
              amount: pendingOrder.financials.totalAmount,
              reason: `Artwork "${soldArtworkTitle}" sold to another buyer`,
            });
            console.log(
              `✅ Refund initiated: ${pendingOrder.financials.totalAmount} SAR`,
            );
          } catch (refundErr) {
            console.error(`❌ Refund failed:`, refundErr.message);
          }
        }

        continue;
      }

      // ─── 4. ✅ كل الـ artworks sold → PAID ───
      const order = await Order.findOneAndUpdate(
        { _id: orderId, status: "PENDING_PAYMENT" },
        {
          $set: {
            status: "PAID",
            "payment.paymentId": paymentId,
            "payment.paidAt": new Date(),
          },
        },
        { new: true, session, runValidators: false },
      );

      if (!order) {
        console.log("⚠️ Order already processed (race condition):", orderId);
        continue;
      }

      console.log("✅ Order updated to PAID:", orderId);
      processedOrders.push(order);

      // ─── 5. Wallet + Transaction (زي ما هو) ───
      let wallet = await Wallet.findOne({ user: order.artist }).session(
        session,
      );
      if (!wallet) {
        wallet = await Wallet.create([{ user: order.artist }], { session });
        wallet = wallet[0];
      }

      await wallet.creditPending(order.financials.totalArtistEarning, session);

      await Transaction.create(
        [
          {
            wallet: wallet._id,
            order: order._id,
            user: order.artist,
            type: "CREDIT_SALE",
            amount: order.financials.totalArtistEarning,
            description: `Sale of ${order.items.length} artwork(s) - Order #${order._id}`,
            balanceAfter: {
              available: wallet.balance.available,
              pending: wallet.balance.pending,
            },
            status: "COMPLETED",
          },
        ],
        { session },
      );
      console.log("✅ Transaction created");
    }

    // ✅ Clear buyer's cart
    await Cart.findOneAndUpdate(
      { user: metadata.buyerId },
      { $set: { items: [] } },
      { session },
    );
    console.log("✅ Cart cleared");

    await session.commitTransaction();
    session.endSession();
    console.log("✅ Transaction committed successfully");

    // ✅ Emit ORDER_PAID event for each processed order
    for (const order of processedOrders) {
      eventEmitter.safeEmit(EVENTS.ORDER_PAID, {
        artistId: order.artist,
        buyerId: order.buyer,
        orderId: order._id,
        orderNumber: order._id.toString().slice(-6).toUpperCase(),
        totalAmount: order.financials.totalAmount,
        order,
      });
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("❌ Webhook processing error:", error);

    // ✅ error مؤقت؟ نرجع 500 عشان Moyasar يعيد الإرسال والـ order يتأكد
    const isTransient =
      error?.codeName === "WriteConflict" ||
      error?.code === 112 ||
      error?.errorLabels?.includes?.("TransientTransactionError") ||
      error?.hasErrorLabel?.("TransientTransactionError");

    if (isTransient) {
      return res
        .status(500)
        .json({ received: false, retry: true, error: error.message });
    }

    // أي error تاني (bug حقيقي) نرجع 200 عشان ما ندخلش في retry loop
    return res.status(200).json({ received: true, error: error.message });
  }
});

// @desc    Artist processes order (PAID → PROCESSING)
// @route   PUT /api/v1/orders/:orderId/process
// @access  Private (Artist only)
const processOrder = catchAsync(async (req, res, next) => {
  const order = await Order.findById(req.params.orderId);
  if (!order) throw new NotFoundError("Order not found");

  if (order.artist.toString() !== req.user._id.toString()) {
    throw new UnauthorizedError("Not authorized to process this order");
  }

  if (order.status !== "PAID") {
    throw new BadRequestError(
      `Cannot process order with status: ${order.status}`,
    );
  }

  order.status = "PROCESSING";
  await order.save();

  return ApiResponse.success(res, order, "Order marked as processing");
});

// @desc    Update order status manually (Admin Override / Fallback)
// @route   PUT /api/v1/orders/:orderId/status
// @access  Private (Admin only)
const updateOrderStatus = catchAsync(async (req, res, next) => {
  // ✅ Admin only — في الحالة الطبيعية الـ webhook بيعمل ده
  if (req.user.role !== "admin") {
    throw new UnauthorizedError(
      "هذه العملية متاحة لفريق المنصة فقط. تحديث الحالة يتم تلقائياً عبر شركة الشحن.",
    );
  }

  const { status, carrier } = req.body;
  const order = await Order.findById(req.params.orderId);
  if (!order) throw new NotFoundError("Order not found");

  // ═══ Validation: حالات مسموح يدوياً ═══
  const allowedStatuses = ["SHIPPED", "DELIVERED", "CANCELLED"];
  if (!allowedStatuses.includes(status)) {
    throw new BadRequestError(
      `حالة غير مسموحة. المسموح يدوياً: ${allowedStatuses.join(", ")}`,
    );
  }

  // ═══ Validation: تدفق منطقي ═══
  const flow = {
    SHIPPED: ["PAID", "PROCESSING"],
    DELIVERED: ["SHIPPED"],
    CANCELLED: ["PENDING_PAYMENT", "PAID", "PROCESSING"],
  };
  if (!flow[status].includes(order.status)) {
    throw new BadRequestError(
      `لا يمكن تحويل من ${order.status} إلى ${status}. التدفق المنطقي: ${flow[status].join(" ← ")} → ${status}`,
    );
  }

  const previousStatus = order.status;
  order.status = status;

  if (status === "SHIPPED") {
    if (carrier) order.shipping.deliveryCompanyName = carrier;
    if (!order.shipping.shippedAt) order.shipping.shippedAt = new Date();
  } else if (status === "DELIVERED") {
    if (!order.shipping.deliveredAt) order.shipping.deliveredAt = new Date();
  }

  // Audit trail — مهم جداً للـ admin override
  order.adminOverrideBy = req.user._id;
  order.adminOverrideAt = new Date();
  order.adminOverrideReason =
    req.body.reason || `Manual status update: ${previousStatus} → ${status}`;

  await order.save();

  // ═══ Emit events (زي الـ webhook بالظبط) ═══
  if (status === "SHIPPED" && previousStatus !== "SHIPPED") {
    eventEmitter.safeEmit(EVENTS.ORDER_SHIPPED, {
      buyerId: order.buyer,
      orderId: order._id,
      orderNumber: order._id.toString().slice(-6).toUpperCase(),
      carrier: carrier || order.shipping?.deliveryCompanyName || "شركة الشحن",
    });
  } else if (status === "DELIVERED" && previousStatus !== "DELIVERED") {
    eventEmitter.safeEmit(EVENTS.ORDER_DELIVERED, {
      buyerId: order.buyer,
      orderId: order._id,
      orderNumber: order._id.toString().slice(-6).toUpperCase(),
    });
  }

  logger.info(
    `🛡️ Admin ${req.user._id} manually updated order ${order._id}: ${previousStatus} → ${status}`,
  );

  return ApiResponse.success(
    res,
    order,
    `✅ تم تحديث حالة الطلب يدوياً إلى ${status}`,
  );
});

// @desc    Buyer confirms delivery (SHIPPED → COMPLETED)
// @route   PUT /api/v1/orders/:orderId/confirm-delivery
// @access  Private (Buyer only)
const confirmDelivery = catchAsync(async (req, res, next) => {
  const order = await Order.findById(req.params.orderId);
  if (!order) throw new NotFoundError("Order not found");

  // ✅ بس المشتري يقدر
  if (order.buyer.toString() !== req.user._id.toString()) {
    throw new UnauthorizedError("You can only confirm your own orders");
  }

  // ✅ لازم يكون DELIVERED
  if (order.status !== "DELIVERED") {
    throw new BadRequestError(
      `Cannot confirm delivery for order with status: ${order.status}`,
    );
  }

  // ✅ لازم يكون لسه مش confirmed
  if (order.status === "COMPLETED") {
    throw new BadRequestError("Order already completed");
  }

  if (order.onHold) {
    throw new BadRequestError(
      "هذا الطلب قيد مراجعة الدعم حالياً ولا يمكن تأكيد الاستلام. يرجى التواصل مع خدمة العملاء.",
    );
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. حدّث الأوردر
    order.status = "COMPLETED";
    order.completedAt = new Date();
    order.fundsReleased = true;
    await order.save({ session });

    // 2. إطلاق الفلوس من pending لـ available
    const wallet = await Wallet.findOne({ user: order.artist }).session(
      session,
    );
    if (
      wallet &&
      wallet.balance.pending >= order.financials.totalArtistEarning
    ) {
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
            description: `إطلاق أموال الطلب #${order._id} بعد تأكيد الاستلام`,
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

    await session.commitTransaction();
    session.endSession();

    logger.info(`✅ Order ${order._id} confirmed by buyer - funds released`);

    return ApiResponse.success(
      res,
      { orderId: order._id, status: "COMPLETED" },
      "تم تأكيد الاستلام بنجاح. سيتم تحويل الأموال للفنان خلال دقائق.",
    );
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    logger.error(`❌ Confirm delivery error:`, error);
    throw error;
  }
});

// @desc    Get current user's orders
// @route   GET /api/v1/orders/my-orders
// @access  Private
const getMyOrders = catchAsync(async (req, res, next) => {
  const userId = req.user._id;
  const { status, page = 1, limit = 10 } = req.query;

  const query = { buyer: userId };
  if (req.query.includeArchived !== "true") {
    query.status = { $ne: "PENDING_PAYMENT" };
  }

  if (status && status !== "all") {
    query.status = status;
  }

  const skip = (Number(page) - 1) * Number(limit);

  const orders = await Order.find(query)
    .populate("items.artwork", "title coverImage images price")
    .populate("artist", "name avatar")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  const total = await Order.countDocuments(query);

  // Add coverImage to each item
  const finalOrders = orders.map((order) => ({
    ...order.toObject(),
    items: order.items.map((item) => ({
      ...item,
      artwork: item.artwork
        ? {
            ...item.artwork.toObject(),
            coverImage:
              item.artwork.images?.[0]?.url || item.artwork.coverImage,
          }
        : null,
    })),
  }));

  return ApiResponse.success(
    res,
    {
      orders: finalOrders,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        limit: Number(limit),
      },
    },
    "Orders retrieved",
  );
});

// @desc    Get single order details (buyer or artist or admin)
// @route   GET /api/v1/orders/:id
// @access  Private
const getOrderById = catchAsync(async (req, res, next) => {
  const order = await Order.findById(req.params.id)
    .populate("buyer", "name email phone address")
    .populate("artist", "name email phone avatar address")
    .populate(
      "items.artwork",
      "title coverImage images price dimensions medium category",
    );

  if (!order) {
    throw new NotFoundError("Order not found");
  }

  // Check access
  const userId = req.user._id.toString();
  const userRole = req.user.role;

  if (
    userRole !== "admin" &&
    order.buyer._id.toString() !== userId &&
    order.artist._id.toString() !== userId
  ) {
    throw new UnauthorizedError("You are not authorized to view this order");
  }

  // Add coverImage to items
  const orderObj = order.toObject();
  orderObj.items = orderObj.items.map((item) => ({
    ...item,
    artwork: item.artwork
      ? {
          ...item.artwork,
          coverImage: item.artwork.images?.[0]?.url || item.artwork.coverImage,
        }
      : null,
  }));

  return ApiResponse.success(res, orderObj, "Order retrieved");
});

// @desc    Get artist's sales (orders where he's the seller)
// @route   GET /api/v1/orders/my-sales
// @access  Private (Artist)
const getMySales = catchAsync(async (req, res, next) => {
  const userId = req.user._id;
  const { status, page = 1, limit = 10 } = req.query;

  const query = { artist: userId };
  if (req.query.includeArchived !== "true") {
    query.status = { $ne: "PENDING_PAYMENT" };
  }
  if (status && status !== "all") query.status = status;

  const skip = (Number(page) - 1) * Number(limit);

  const orders = await Order.find(query)
    .populate("buyer", "name avatar")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  const total = await Order.countDocuments(query);

  // ✅ نبسط الشكل اللي بيرجع للفرونت
  const finalOrders = orders.map((order) => ({
    _id: order._id,
    status: order.status,
    createdAt: order.createdAt,
    cancellationReason: order.cancellationReason,
    cancelledAt: order.cancelledAt,
    cancelledBy: order.cancelledBy,
    refundStatus: order.refundStatus,
    onHold: order.onHold,
    fundsReleased: order.fundsReleased,
    totalAmount: order.financials.subtotal,
    artistEarning: order.financials.totalArtistEarning,
    buyer: order.buyer,
    items: order.items.map((item) => ({
      title: item.artworkSnapshot?.title,
      coverImage: item.artworkSnapshot?.coverImage,
      price: item.artworkSnapshot?.price,
    })),
    shipping: {
      deliveryCompanyName: order.shipping?.deliveryCompanyName,
      carrier: order.shipping?.carrier,
      trackingNumber: order.shipping?.trackingNumber,
      trackingUrl: order.shipping?.trackingUrl,
      awbUrl: order.shipping?.awbUrl,
      shippedAt: order.shipping?.shippedAt,
      deliveredAt: order.shipping?.deliveredAt,
    },
  }));

  return ApiResponse.success(
    res,
    {
      orders: finalOrders,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        limit: Number(limit),
      },
    },
    "Sales retrieved",
  );
});

// @desc    Cancel order (buyer only, before shipping)
// @route   PATCH /api/v1/orders/:orderId/cancel
// @access  Private (Buyer)
const cancelOrder = catchAsync(async (req, res, next) => {
  const { orderId } = req.params;
  const { reason } = req.body;

  const order = await Order.findById(orderId);
  if (!order) throw new NotFoundError("Order not found");

  // ✅ بس المشتري يقدر يلغي
  if (order.buyer.toString() !== req.user._id.toString()) {
    throw new UnauthorizedError("You can only cancel your own orders");
  }

  // ✅ بس قبل الشحن
  const cancellableStatuses = ["PENDING_PAYMENT", "PAID", "PROCESSING"];
  if (!cancellableStatuses.includes(order.status)) {
    throw new BadRequestError(
      `Cannot cancel order with status: ${order.status}. Only pending/paid/processing orders can be cancelled.`,
    );
  }

  const originalStatus = order.status;
  const wasPaid = ["PAID", "PROCESSING"].includes(originalStatus);

  // ═══════════════════════════════════════════════════
  // ✅ لو PROCESSING: نتأكد من حالة الشحنة في OTO ونلغيها هناك الأول
  // ═══════════════════════════════════════════════════
  if (originalStatus === "PROCESSING" && order.shipping?.otoListId) {
    try {
      const otoStatus = await otoService.getOrderStatus(
        order.shipping.otoListId,
      );
      const liveStatus = Array.isArray(otoStatus)
        ? otoStatus[0]?.status
        : otoStatus?.status;

      // لو الشحنة خرجت فعلاً من الفنان → مفيش إلغاء
      const postPickupStatuses = [
        "pickedUp",
        "inTransit",
        "outForDelivery",
        "delivered",
      ];
      if (liveStatus && postPickupStatuses.includes(liveStatus)) {
        throw new BadRequestError(
          "الشحنة خرجت بالفعل مع المندوب ولا يمكن إلغاؤها الآن. تواصل مع الدعم للمساعدة.",
        );
      }

      // إلغاء الشحنة في OTO (رسوم الشحن هترجع لرصيدنا في OTO)
      const cancelRes = await otoService.cancelOrder(order.shipping.otoListId);
      if (cancelRes?.success === false) {
        throw new BadRequestError(
          cancelRes.otoErrorMessage || "OTO رفض إلغاء الشحنة",
        );
      }
      logger.info(`✅ OTO shipment cancelled: ${order.shipping.otoListId}`);
    } catch (err) {
      if (err instanceof BadRequestError) throw err;
      logger.error("❌ Failed to cancel OTO shipment:", err.message);
      throw new BadRequestError(
        "تعذر إلغاء الشحنة لدى شركة الشحن حالياً، حاول مرة أخرى أو تواصل مع الدعم.",
      );
    }
  }

  // ═══════════════════════════════════════════════════
  // ✅ Moyasar Refund (قبل الـ DB transaction)
  // ═══════════════════════════════════════════════════
  let refundResult = null;
  let shouldReverseWallet = false;

  if (wasPaid) {
    shouldReverseWallet = true;

    let paymentIdToRefund = null;
    let alreadyRefunded = false; // ✅ جديد

    // المحاولة 1: الـ paymentId المحفوظ
    if (order.payment?.paymentId) {
      try {
        const payment = await MoyasarService.fetchPayment(
          order.payment.paymentId,
        );
        if (payment?.status === "paid" || payment?.status === "captured") {
          paymentIdToRefund = order.payment.paymentId;
          logger.info(`✅ Using stored paymentId: ${paymentIdToRefund}`);
        } else if (payment?.status === "refunded") {
          // ✅ الفلوس رجعت قبل كده — نسجلها ومش هنعمل refund تاني
          alreadyRefunded = true;
          logger.info(
            `ℹ️ Payment was already refunded: ${order.payment.paymentId}`,
          );
        } else {
          logger.warn(
            `⚠️ Stored paymentId status is "${payment?.status}" — trying invoice`,
          );
        }
      } catch (e) {
        logger.warn(
          `⚠️ Stored paymentId invalid (${e.message}) — trying invoice`,
        );
      }
    }

    // المحاولة 2: من الـ invoice (زي ما هي)
    if (!paymentIdToRefund && !alreadyRefunded && order.payment?.invoiceId) {
      // ... نفس الكود القديم بتاع الـ invoice fallback ...
    }

    // ── refund لو لسه محتاج ──
    if (paymentIdToRefund) {
      try {
        refundResult = await MoyasarService.refundPayment(paymentIdToRefund, {
          amount: Math.round(order.financials.totalAmount * 100),
          reason: reason || "Order cancelled by buyer",
        });
        logger.info(`✅ Refund initiated: ${refundResult.id}`);
      } catch (refundError) {
        logger.error(`❌ Refund failed: ${refundError.message}`);
      }
    } else if (!alreadyRefunded) {
      logger.warn(
        `⚠️ No paid payment found for order ${orderId} — cancelling without Moyasar refund`,
      );
    }

    // ✅ نسجل alreadyRefunded عشان الـ refundStatus يطلع صح تحت
    if (alreadyRefunded)
      refundResult = { id: "already-refunded", status: "refunded" };
  }

  // ═══════════════════════════════════════════════════
  // ✅ DB Transaction: cancel + unsold + wallet reverse
  // ═══════════════════════════════════════════════════
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Cancel order
    order.status = "CANCELLED";
    order.cancelledAt = new Date();
    order.cancellationReason = reason || "Cancelled by buyer";
    order.cancelledBy = "buyer";

    if (wasPaid && refundResult) {
      order.refundStatus = "COMPLETED";
      order.refundRequestedAt = new Date();
    }
    await order.save({ session });

    for (const item of order.items) {
      await Artwork.findOneAndUpdate(
        { _id: item.artwork },
        {
          isSold: false,
          reservedBy: null,
          reservedUntil: null,
        },
        { session },
      );
      logger.info(`✅ Artwork ${item.artwork} unmarked as sold`);
    }

    // 3. Reverse wallet pending (لو كان مدفوع)
    if (shouldReverseWallet) {
      const wallet = await Wallet.findOne({ user: order.artist }).session(
        session,
      );
      if (
        wallet &&
        wallet.balance.pending >= order.financials.totalArtistEarning
      ) {
        await wallet.debitPending(order.financials.totalArtistEarning, session);

        await Transaction.create(
          [
            {
              wallet: wallet._id,
              order: order._id,
              user: order.artist,
              type: "DEBIT_REFUND",
              amount: -order.financials.totalArtistEarning,
              description: `Refund for cancelled Order #${order._id}`,
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
    }

    await session.commitTransaction();
    session.endSession();

    logger.info(
      `✅ Order ${orderId} cancelled (was: ${originalStatus}, refund: ${refundResult ? refundResult.id : "none"})`,
    );

    return ApiResponse.success(
      res,
      {
        order: {
          _id: order._id,
          status: order.status,
          cancelledAt: order.cancelledAt,
          cancellationReason: order.cancellationReason,
          cancelledBy: order.cancelledBy,
          refundStatus: order.refundStatus || null,
        },
        refund: refundResult
          ? { id: refundResult.id, status: refundResult.status }
          : null,
      },
      wasPaid && refundResult
        ? "Order cancelled and refund initiated. Amount will be returned within 3-14 business days."
        : wasPaid
          ? "Order cancelled. Refund could not be processed automatically — please contact support."
          : "Order cancelled successfully.",
    );
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    logger.error(`❌ Cancel order transaction error for ${orderId}:`, error);
    throw error;
  }
});

// @desc    Verify credit card payment (client-side verification fallback)
// @route   POST /api/v1/orders/verify-payment
// @access  Protected
// const verifyPayment = catchAsync(async (req, res, next) => {
//   const { paymentId } = req.body;
//   if (!paymentId) {
//     throw new BadRequestError("Payment ID is required");
//   }

//   logger.info(`🔍 Verifying payment with ID: ${paymentId}`);

//   // 1. Fetch payment details from Moyasar
//   const payment = await MoyasarService.fetchPayment(paymentId);
//   if (!payment) {
//     throw new NotFoundError("Payment not found on Moyasar");
//   }

//   // 2. Verify status
//   if (payment.status !== "paid" && payment.status !== "captured") {
//     return ApiResponse.success(
//       res,
//       { verified: false, status: payment.status },
//       "Payment not paid yet",
//     );
//   }

//   // 3. Extract metadata
//   let metadata = payment.metadata || {};
//   if (!metadata.orderIds && payment.invoice_id) {
//     const invoice = await MoyasarService.fetchInvoice(payment.invoice_id);
//     metadata = invoice.metadata || {};
//   }

//   if (metadata.type !== "artwork_purchase") {
//     return ApiResponse.success(
//       res,
//       { verified: false },
//       "Not an artwork purchase payment",
//     );
//   }

//   let orderIds = metadata.orderIds ? metadata.orderIds.split(",") : [];
//   if (orderIds.length === 0) {
//     const ordersInDb = await Order.find({
//       $or: [
//         { "payment.invoiceId": payment.invoice_id },
//         { "payment.paymentId": paymentId },
//       ],
//     });
//     orderIds = ordersInDb.map((o) => o._id.toString());
//   }

//   if (orderIds.length === 0) {
//     throw new NotFoundError("No orders associated with this payment");
//   }

//   // ✅ 4. Idempotency check - لو كل الـ orders already PAID، ارجع success
//   const existingPaidOrders = await Order.find({
//     _id: { $in: orderIds },
//     status: {
//       $in: ["PAID", "PROCESSING", "SHIPPED", "DELIVERED", "COMPLETED"],
//     },
//   });

//   if (existingPaidOrders.length === orderIds.length) {
//     logger.info("⚠️ All orders already processed (idempotent response)");
//     return ApiResponse.success(
//       res,
//       { verified: true, orders: existingPaidOrders, alreadyProcessed: true },
//       "Orders already processed successfully",
//     );
//   }

//   // 5. Process orders
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     const processedOrders = [];

//     for (const orderId of orderIds) {
//       const order = await Order.findOneAndUpdate(
//         { _id: orderId, status: "PENDING_PAYMENT" },
//         {
//           $set: {
//             status: "PAID",
//             "payment.paymentId": paymentId,
//             "payment.paidAt": new Date(),
//           },
//         },
//         { new: true, session, runValidators: false },
//       );

//       if (!order) {
//         logger.warn(`⚠️ Skipping order (not PENDING_PAYMENT): ${orderId}`);
//         continue;
//       }

//       processedOrders.push(order);

//       // Mark artworks as sold
//       for (const item of order.items) {
//         await Artwork.findByIdAndUpdate(
//           item.artwork,
//           { isSold: true },
//           { session },
//         );
//       }

//       // Wallet credit
//       let wallet = await Wallet.findOne({ user: order.artist }).session(
//         session,
//       );
//       if (!wallet) {
//         wallet = await Wallet.create([{ user: order.artist }], { session });
//         wallet = wallet[0];
//       }

//       await wallet.creditPending(order.financials.totalArtistEarning, session);

//       await Transaction.create(
//         [
//           {
//             wallet: wallet._id,
//             order: order._id,
//             user: order.artist,
//             type: "CREDIT_SALE",
//             amount: order.financials.totalArtistEarning,
//             description: `Sale of ${order.items.length} artwork(s) - Order #${order._id}`,
//             balanceAfter: {
//               available: wallet.balance.available,
//               pending: wallet.balance.pending,
//             },
//             status: "COMPLETED",
//           },
//         ],
//         { session },
//       );
//     }

//     // Clear buyer's cart
//     const buyerId = metadata.buyerId || req.user?._id;
//     if (buyerId) {
//       await Cart.findOneAndUpdate(
//         { user: buyerId },
//         { $set: { items: [] } },
//         { session },
//       );
//     }

//     await session.commitTransaction();
//     session.endSession();

//     return ApiResponse.success(
//       res,
//       { verified: true, orders: processedOrders },
//       "Payment verified and orders processed",
//     );
//   } catch (error) {
//     await session.abortTransaction();
//     session.endSession();
//     logger.error("❌ Verification transaction error:", error);
//     throw error;
//   }
// });

module.exports = {
  checkout,
  handleMoyasarWebhook,
  processOrder,
  updateOrderStatus,
  confirmDelivery,
  getMyOrders,
  getMySales,
  getOrderById,
  cancelOrder,
  // verifyPayment
};
