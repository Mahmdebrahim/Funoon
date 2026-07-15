// src/controllers/order.controller.js
const mongoose = require("mongoose");
const Cart = require("../models/Cart");
const Order = require("../models/Order");
const Artwork = require("../models/Artwork");
const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");
const MoyasarService = require("../services/payment/moyasar.service");
const OTOService = require("../services/shipping/oto.service");

const {
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
} = require("../utils/api-error");
const ApiResponse = require("../utils/api-response");
const catchAsync = require("../utils/catch-async");
const logger = require("../utils/logger");

const otoService = OTOService;

/**
 * ✅ Helper function: فلترة خيارات الشحن من OTO
 * - استبعاد PUDO (pickupByCustomer) - العميل مش هيرفع ياخد من فرع
 * - استبعاد dropoffOnly - الفنان مش هيرفع يودّي للفرع
 * - لازم يوصل لحد البيت (toCustomerDoorstep)
 * - لازم الشركة بتيجي تاخد من الفنان (freePickup أو freePickupDropoff)
 */
const filterShippingOptions = (deliveryOptions) => {
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
    return true;
  });
};

/**
 * ✅ Helper function: اختيار أرخص خيار صالح
 */
const selectCheapestOption = (validOptions) => {
  if (!validOptions || validOptions.length === 0) return null;

  return validOptions.reduce((min, opt) => (opt.price < min.price ? opt : min));
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
    { path: "items.artist", select: "name email subscription address phone" },
  ]);

  // 4. Validate all items and group by artist
  const ordersByArtist = new Map();

  for (const item of cart.items) {
    const artwork = item.artwork;
    const artist = item.artist;

    // Validate artwork
    if (!artwork || !artwork.isActive || artwork.isSold) {
      throw new BadRequestError(
        `Artwork "${artwork?.title}" is no longer available`,
      );
    }

    // Validate artist subscription
    if (!artist || !artist.hasActiveSubscription()) {
      throw new BadRequestError(
        `Artist "${artist?.name}" does not have an active subscription`,
      );
    }

    // Get commission rate
    const commissionRate = artist.getCommissionRate();
    const artistPlan = artist.subscription.plan;

    // ✅ حساب الشحن من OTO مع الفلترة الذكية
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
      });

      // ✅ فلترة الخيارات (استبعاد PUDO و dropoffOnly)
      const allOptions = otoResponse.deliveryCompany || [];
      const validOptions = filterShippingOptions(allOptions);

      logger.info(
        `📦 OTO Options: ${allOptions.length} total, ${validOptions.length} valid after filtering`,
      );

      // ✅ اختيار الأرخص من الخيارات الصالحة
      selectedOption = selectCheapestOption(validOptions);

      if (selectedOption) {
        shippingCost = selectedOption.price;
        logger.info(
          `✅ Selected shipping: ${selectedOption.deliveryCompanyName} - ${shippingCost} SAR`,
        );
      } else {
        // ⚠️ Fallback: لو مفيش خيارات صالحة، نختار أرخص option متاح (حتى لو مش ideal)
        const fallbackOption = selectCheapestOption(allOptions);
        if (fallbackOption) {
          selectedOption = fallbackOption;
          shippingCost = fallbackOption.price;
          logger.warn(
            `⚠️ No valid shipping options found, using fallback: ${fallbackOption.deliveryCompanyName} - ${shippingCost} SAR`,
          );
        } else {
          shippingCost = 25; // Default fallback
          logger.warn("⚠️ No delivery options at all, using default: 25 SAR");
        }
      }
    } catch (error) {
      logger.error("❌ OTO shipping calculation error:", error.message);
      shippingCost = 25; // fallback
    }

    // ✅ لو Prestige، الشحن على الموقع
    const platformShippingExpense =
      artistPlan === "opal_prestige" && artwork.shippingType === "standard"
        ? shippingCost
        : 0;

    // ✅ العميل بيدفع الشحن إلا لو Prestige
    const buyerPaysShipping = platformShippingExpense === 0 ? shippingCost : 0;

    // Calculate financials
    const artworkPrice = artwork.price;
    const platformCommission =
      Math.round(artworkPrice * commissionRate * 100) / 100;
    const artistEarning = artworkPrice - platformCommission;

    // Group by artist
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
          // ✅ حفظ بيانات شركة الشحن المختارة
          deliveryOptionId: selectedOption?.deliveryOptionId || null,
          deliveryCompanyName: selectedOption?.deliveryCompanyName || null,
          deliveryOptionName: selectedOption?.deliveryOptionName || null,
          estimatedDeliveryDate: selectedOption?.estimatedDeliveryDate || null,
          pickupDropoff: selectedOption?.pickupDropoff || null,
          deliveryType: selectedOption?.deliveryType || null,
          serviceType: selectedOption?.serviceType || null,
          logo: selectedOption?.logo || null,

          // Addresses Snapshots
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

    // Add item
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

    // Update financials totals
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
    const orders = [];
    for (const orderData of ordersByArtist.values()) {
      const order = await Order.create([orderData], { session });
      orders.push(order[0]);
    }

    const grandTotal = orders.reduce(
      (sum, order) => sum + order.financials.totalAmount,
      0,
    );

    // Create Moyasar invoice
    const invoiceData = {
      amount: grandTotal * 100,
      description: `Funoon.sa - ${orders.length} artwork(s)`,
      callbackUrl: `${process.env.NGROK_URL}/api/v1/webhooks/moyasar`,
      successUrl: `${process.env.FRONTEND_URL}/payment/success`,
      backUrl: `${process.env.FRONTEND_URL}/payment/cancel`,
      metadata: {
        orderIds: orders.map((o) => o._id.toString()).join(","),
        buyerId: buyer._id.toString(),
        type: "artwork_purchase",
      },
    };

    const moyasarInvoice = await MoyasarService.createInvoice(invoiceData);

    // Save invoice ID
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
            estimatedDeliveryDate: o.shipping?.estimatedDeliveryDate,
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
    await session.abortTransaction();
    session.endSession();
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
    console.log("🔍 No orderIds in metadata, searching by invoiceId:", invoiceId);

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

  // ✅ Transaction للمعاملات المالية
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    console.log("🔄 Processing orders...");

    const processedOrders = [];
    const paymentId = event.payments?.[0]?.id || event.id;

    for (const orderId of orderIds) {
      // ✅ استخدام findOneAndUpdate لتجنب VersionError
      const order = await Order.findOneAndUpdate(
        {
          _id: orderId,
          status: "PENDING_PAYMENT", // ✅ بس PENDING_PAYMENT تتحدث
        },
        {
          $set: {
            status: "PAID",
            "payment.paymentId": paymentId,
            "payment.paidAt": new Date(),
          },
        },
        {
          new: true,
          session,
          runValidators: false,
        },
      );

      // لو مش لاقينه أو مش PENDING_PAYMENT، skip
      if (!order) {
        console.log("⚠️ Skipping order (not found or not PENDING_PAYMENT):", orderId);
        continue;
      }

      console.log("✅ Order updated to PAID:", orderId);
      processedOrders.push(order);

      // ✅ Mark artworks as sold (atomic operation)
      for (const item of order.items) {
        await Artwork.findByIdAndUpdate(
          item.artwork,
          { isSold: true },
          { session },
        );
        console.log("✅ Artwork marked as sold:", item.artwork);
      }

      // ✅ Find or create artist wallet
      let wallet = await Wallet.findOne({ user: order.artist }).session(session);
      if (!wallet) {
        wallet = await Wallet.create([{ user: order.artist }], { session });
        wallet = wallet[0];
        console.log("✅ Created new wallet for artist");
      }

      // ✅ Credit pending balance
      await wallet.creditPending(order.financials.totalArtistEarning, session);
      console.log(
        "✅ Credited pending balance:",
        order.financials.totalArtistEarning,
      );

      // ✅ Create transaction record
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

    return res.status(200).json({ received: true });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("❌ Webhook processing error:", error);
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

// @desc    Buyer confirms delivery (SHIPPED → COMPLETED)
// @route   PUT /api/v1/orders/:orderId/confirm-delivery
// @access  Private (Buyer only)
const confirmDelivery = catchAsync(async (req, res, next) => {
  const order = await Order.findById(req.params.orderId);
  if (!order) throw new NotFoundError("Order not found");

  if (order.buyer.toString() !== req.user._id.toString()) {
    throw new UnauthorizedError("Not authorized to confirm this order");
  }

  if (order.status !== "SHIPPED" && order.status !== "DELIVERED") {
    throw new BadRequestError(
      `Cannot confirm delivery for order with status: ${order.status}`,
    );
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
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
            description: `Funds released for Order #${order._id}`,
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

    return ApiResponse.success(res, order, "Delivery confirmed successfully");
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
});

module.exports = {
  checkout,
  handleMoyasarWebhook,
  processOrder,
  confirmDelivery,
};
