// src/controllers/shipping.controller.js
const mongoose = require("mongoose");
const Order = require("../models/Order");
const Artwork = require("../models/Artwork");
const User = require("../models/User");
const OTOService = require("../services/shipping/oto.service");
const {
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
} = require("../utils/api-error");
const ApiResponse = require("../utils/api-response");
const catchAsync = require("../utils/catch-async");
const logger = require("../utils/logger");
const eventEmitter = require("../events/event-emitter");
const EVENTS = require("../events/events");

const otoService = OTOService;

// ✅ Helper: فلترة خيارات الشحن
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

// @desc    Calculate shipping cost (للـ Frontend قبل الـ Checkout)
// @route   POST /api/v1/shipping/calculate
const calculateShipping = catchAsync(async (req, res, next) => {
  const { artworkId, destinationCity } = req.body;

  const artwork = await Artwork.findById(artworkId).populate("artist");
  if (!artwork) throw new NotFoundError("Artwork not found");

  const artist = artwork.artist;
  const originCity = artist.address?.city || "Riyadh";

  const response = await otoService.checkOTODeliveryFee({
    originCity,
    destinationCity: destinationCity || req.user.address?.city || "Riyadh",
    weight: artwork.weight || 2,
    length: artwork.dimensions?.width || 60,
    width: artwork.dimensions?.height || 80,
    height: artwork.dimensions?.depth || 3,
    shippingType: artwork.shippingType || "standard",
  });

  const allOptions = response.deliveryCompany || [];
  const validOptions = filterShippingOptions(allOptions, artwork.price);

  logger.info(
    `📦 calculateShipping: ${allOptions.length} total, ${validOptions.length} valid after filtering`,
  );

  const optionsToShow = validOptions.length > 0 ? validOptions : allOptions;

  const cheapestOption = optionsToShow.reduce(
    (min, opt) => (opt.price < min.price ? opt : min),
    optionsToShow[0] || { price: Infinity },
  );

  return ApiResponse.success(
    res,
    {
      originCity,
      destinationCity: destinationCity || req.user.address?.city,
      options: optionsToShow.map((option) => ({
        deliveryOptionId: option.deliveryOptionId,
        carrier: option.deliveryCompanyName,
        deliveryOptionName: option.deliveryOptionName,
        price: option.price,
        avgDeliveryTime: option.avgDeliveryTime,
        pickupCutOffTime: option.pickupCutOffTime,
        maxFreeWeight: option.maxFreeWeight,
        extraWeightPerKg: option.extraWeightPerKg,
        serviceType: option.serviceType,
        deliveryType: option.deliveryType,
        pickupDropoff: option.pickupDropoff,
        logo: option.logo,
      })),
      recommended: cheapestOption
        ? {
            deliveryOptionId: cheapestOption.deliveryOptionId,
            carrier: cheapestOption.deliveryCompanyName,
            price: cheapestOption.price,
          }
        : null,
      hasValidOptions: validOptions.length > 0,
    },
    "Shipping cost calculated",
  );
});

// @desc    Create shipment for order
// @route   POST /api/v1/shipping/create
const createShipment = catchAsync(async (req, res, next) => {
  const { orderId } = req.body;

  const order = await Order.findById(orderId);

  if (!order) throw new NotFoundError("Order not found");

  if (order.artist.toString() !== req.user._id.toString()) {
    throw new UnauthorizedError("Not authorized to ship this order");
  }

  if (order.status !== "PAID") {
    throw new BadRequestError(
      `Cannot create shipment for order with status: ${order.status}`,
    );
  }

  if (order.shipping?.otoListId) {
    throw new BadRequestError(
      "Shipment already created for this order. Use tracking endpoint.",
    );
  }

  const deliveryOptionId = order.shipping?.deliveryOptionId;

  if (!deliveryOptionId) {
    throw new BadRequestError(
      "No delivery option found for this order. Please contact support.",
    );
  }

  const artistAddress = order.shipping?.artistAddress || {};
  const buyerAddress = order.shipping?.buyerAddress || {};

  console.log("🏠 Artist Address:", JSON.stringify(artistAddress));
  console.log("🏠 Buyer Address:", JSON.stringify(buyerAddress));

  if (!artistAddress.city || !buyerAddress.city) {
    throw new BadRequestError(
      "Missing address information in order. Please contact support.",
    );
  }

  const funoonOrderId = `FUNOON-${order._id}`;

  // ═══════════════════════════════════════════════════════════════
  // ✅ الخطوة 1: Create Order (بدون createShipment)
  // ═══════════════════════════════════════════════════════════════
  const dims = order.items.reduce(
    (acc, item) => {
      const d = item.artworkSnapshot?.dimensions || {};
      return {
        width: Math.max(acc.width, d.width || 60),
        length: Math.max(acc.length, d.height || 80),
        height: acc.height + (d.depth || 3),
        weight: acc.weight + (d.weight || 2),
      };
    },
    { width: 0, length: 0, height: 0, weight: 0 },
  );

  const orderData = {
    orderId: funoonOrderId,
    deliveryOptionId: deliveryOptionId,
    paymentMethod: "paid",
    amount: order.financials.subtotal,
    currency: order.financials.currency || "SAR",
    packageCount: order.items.length,
    packageWeight: dims.weight,
    boxWidth: dims.width,
    boxLength: dims.length,
    boxHeight: dims.height,
    senderInformation: {
      senderFullName: artistAddress.name || "Artist",
      senderMobile: artistAddress.phone?.replace(/[^0-9]/g, "") || "0500000000",
      senderCountry: artistAddress.country || "SA",
      senderCity: artistAddress.city,
      senderDistrict: artistAddress.district || "",
      senderStreet: artistAddress.street || "",
      senderAddressLine:
        `${artistAddress.buildingNo || ""}, ${artistAddress.street || ""}, ${artistAddress.district || ""}, ${artistAddress.city}, Saudi Arabia`.trim(),
      senderBuildingNo: artistAddress.buildingNo || "",
      senderPostcode: artistAddress.zipCode || "",
      senderShortAddressCode: artistAddress.shortAddressCode || "",
      lat: artistAddress.lat || undefined,
      lon: artistAddress.lon || undefined,
    },
    customer: {
      name: buyerAddress.name || "Customer",
      mobile: buyerAddress.phone?.replace(/[^0-9]/g, "") || "0500000000",
      address:
        `${buyerAddress.buildingNo || ""}, ${buyerAddress.street || ""}, ${buyerAddress.district || ""}, ${buyerAddress.city}, Saudi Arabia`.trim(),
      city: buyerAddress.city,
      district: buyerAddress.district || "",
      country: buyerAddress.country || "SA",
      postcode: buyerAddress.zipCode || "",
      buildingNo: buyerAddress.buildingNo || "",
      street: buyerAddress.street || "",
      shortAddressCode: buyerAddress.shortAddressCode || "",
      lat: buyerAddress.lat || undefined,
      lon: buyerAddress.lon || undefined,
    },
    items: order.items.map((item) => ({
      name: item.artworkSnapshot?.title || "Artwork",
      quantity: 1,
      price: item.artworkSnapshot?.price || 0,
      sku: `ART-${item.artwork}`,
    })),
  };

  logger.info(`📦 [Step 1/4] Creating OTO order for ${order._id}...`);

  let otoOrderResponse;
  try {
    otoOrderResponse = await otoService.createOrder(orderData);
  } catch (err) {
    logger.error("❌ createOrder failed:", err);
    throw new BadRequestError(
      err.otoErrorMessage || "Failed to create order in OTO",
    );
  }

  if (otoOrderResponse.success === false) {
    logger.error(
      "❌ OTO createOrder failed:",
      JSON.stringify(otoOrderResponse, null, 2),
    );
    throw new BadRequestError(
      otoOrderResponse.otoErrorMessage || "Failed to create order in OTO",
    );
  }

  logger.info("✅ [Step 1/4] OTO order created successfully");
  logger.info(`   🔑 OTO ID: ${otoOrderResponse.otoId || "(not returned)"}`);

  // ═══════════════════════════════════════════════════════════════
  // ✅ الخطوة 2: Create Shipment (endpoint منفصل)
  // ═══════════════════════════════════════════════════════════════
  logger.info(`📦 [Step 2/4] Creating shipment for: ${funoonOrderId}...`);

  let shipmentResponse = null;
  try {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    shipmentResponse = await otoService.createShipment(
      funoonOrderId,
      deliveryOptionId,
    );
    logger.info("✅ [Step 2/4] OTO shipment created successfully");
    logger.info(
      "📥 createShipment response:",
      JSON.stringify(shipmentResponse, null, 2),
    );
  } catch (err) {
    logger.error("❌ createShipment failed:", err.message || err);
  }

  // ═══════════════════════════════════════════════════════════════
  // ✅ الخطوة 3: Print AWB (للحصول على رابط الطباعة)
  // ═══════════════════════════════════════════════════════════════
  let awbResponse = null;
  try {
    await new Promise((resolve) => setTimeout(resolve, 500));
    awbResponse = await otoService.printAWB(funoonOrderId);
    logger.info("✅ [Step 3/4] AWB retrieved successfully");
    logger.info("📥 printAWB response:", JSON.stringify(awbResponse, null, 2));
  } catch (err) {
    logger.warn(
      "⚠️ [Step 3/4] Could not retrieve AWB yet (may come via webhook later):",
      err.otoErrorMessage || err.message,
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // ✅ الخطوة 4: جلب البيانات الكاملة من orderStatus (مع Retry Logic)
  // ═══════════════════════════════════════════════════════════════
  let orderStatus = null;
  let trackingNumber = "";
  let trackingUrl = "";
  let awbUrl = "";
  let carrier = "";

  const maxRetries = 2;
  const retryDelay = 1500;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const waitTime = attempt === 1 ? 2000 : retryDelay;
      logger.info(
        `⏳ [Step 4/4] Attempt ${attempt}/${maxRetries} - waiting ${waitTime / 1000}s before fetching orderStatus...`,
      );
      await new Promise((resolve) => setTimeout(resolve, waitTime));

      orderStatus = await otoService.getOrderStatus(funoonOrderId);

      if (orderStatus?.success) {
        logger.info(
          `✅ [Step 4/4] Attempt ${attempt} - orderStatus retrieved`,
        );

        // استخراج البيانات
        trackingNumber =
          orderStatus?.shipmentId || orderStatus?.trackingNumber || "";
        trackingUrl = orderStatus?.trackingUrl || "";
        awbUrl = orderStatus?.printAWBURL || "";
        carrier = orderStatus?.deliveryCompany || "";

        // لو لقينا trackingNumber، كده كفاية
        if (trackingNumber) {
          logger.info(`🎯 Got tracking data on attempt ${attempt}`);
          break;
        } else {
          logger.info(
            `⚠️ Attempt ${attempt} - trackingNumber still empty, will retry...`,
          );
        }
      }
    } catch (err) {
      logger.warn(`⚠️ Attempt ${attempt} failed:`, err.message);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // ✅ Fallback: لو لسه مفيش بيانات، هنعتمد على الـ webhook اللي هيجي
  // ═══════════════════════════════════════════════════════════════
  if (!trackingNumber) {
    logger.warn(
      `⚠️ Could not get tracking data after ${maxRetries} attempts - will rely on webhook`,
    );
  }

  logger.info(`📊 Final shipping info:`);
  logger.info(
    `   📦 Tracking Number: ${trackingNumber || "(waiting for webhook)"}`,
  );
  logger.info(
    `   🔗 Tracking URL: ${trackingUrl || "(waiting for webhook)"}`,
  );
  logger.info(`   📄 AWB URL: ${awbUrl || "(waiting for webhook)"}`);
  logger.info(
    `   🚚 Carrier: ${carrier || order.shipping?.deliveryCompanyName || "OTO"}`,
  );

  // ═══════════════════════════════════════════════════════════════
  // ✅ تحديث الأوردر في الـ DB
  // ═══════════════════════════════════════════════════════════════
  const updateData = {
    status: "PROCESSING",
    "shipping.carrier":
      carrier || order.shipping?.deliveryCompanyName || "OTO",
    "shipping.trackingNumber": trackingNumber,
    "shipping.trackingUrl": trackingUrl,
    "shipping.awbUrl": awbUrl,
    "shipping.otoListId": funoonOrderId,
    "shipping.otoShipmentId":
      orderStatus?.shipmentId ||
      orderStatus?.dcTrackingNumber ||
      shipmentResponse?.shipmentId ||
      (otoOrderResponse?.otoId ? String(otoOrderResponse.otoId) : ""),
    "shipping.shippedAt": new Date(),
  };

  const updatedOrder = await Order.findByIdAndUpdate(
    order._id,
    { $set: updateData },
    { new: true, runValidators: false },
  );

  if (!updatedOrder) {
    throw new NotFoundError("Order not found during update");
  }

  logger.info(`✅ Order ${order._id} updated to PROCESSING`);

  // ═══════════════════════════════════════════════════════════════
  // ✅ Response للـ Frontend
  // ═══════════════════════════════════════════════════════════════
  const responseData = {
    order: {
      _id: updatedOrder._id,
      status: updatedOrder.status,
      funoonOrderId: funoonOrderId,
    },
    shipping: {
      carrier: updatedOrder.shipping?.carrier,
      trackingNumber: updatedOrder.shipping?.trackingNumber,
      trackingUrl: updatedOrder.shipping?.trackingUrl,
      awbUrl: updatedOrder.shipping?.awbUrl,
      deliveryCompanyName: updatedOrder.shipping?.deliveryCompanyName,
      estimatedDeliveryDate: updatedOrder.shipping?.estimatedDeliveryDate,
    },
  };

  // لو البيانات لسه فاضية، نبعت message واضح
  if (!trackingNumber) {
    responseData.message =
      "تم إنشاء الشحنة بنجاح. بيانات التتبع والبولصة ستصل خلال دقائق قليلة.";
  }

  return ApiResponse.success(
    res,
    responseData,
    "Shipment created successfully",
  );
});

// @desc    Get AWB print URL
// @route   GET /api/v1/shipping/:orderId/awb
const getAWBUrl = catchAsync(async (req, res, next) => {
  const order = await Order.findById(req.params.orderId);
  if (!order) throw new NotFoundError("Order not found");

  const isArtist = order.artist.toString() === req.user._id.toString();
  const isAdmin = req.user.role === "admin";
  if (!isArtist && !isAdmin) {
    throw new UnauthorizedError("Not authorized to access AWB");
  }

  if (!order.shipping?.awbUrl) {
    // ✅ محاولة 1: نجيب الـ awbUrl من orderStatus (الأفضل)
    try {
      const orderStatus = await otoService.getOrderStatus(
        `FUNOON-${order._id}`,
      );

      if (orderStatus?.printAWBURL) {
        order.shipping.awbUrl = orderStatus.printAWBURL;
        if (orderStatus.trackingUrl && !order.shipping.trackingUrl) {
          order.shipping.trackingUrl = orderStatus.trackingUrl;
        }
        if (orderStatus.shipmentId && !order.shipping.trackingNumber) {
          order.shipping.trackingNumber = orderStatus.shipmentId;
        }
        await order.save();

        logger.info(`✅ AWB URL retrieved from orderStatus for ${order._id}`);

        return ApiResponse.success(
          res,
          {
            awbUrl: order.shipping.awbUrl,
            trackingUrl: order.shipping.trackingUrl,
          },
          "AWB URL retrieved",
        );
      }
    } catch (err) {
      logger.warn("Could not retrieve AWB from orderStatus:", err.message);
    }

    // ✅ محاولة 2 (fallback): نجرب printAWB endpoint
    try {
      const awbResponse = await otoService.printAWB(`FUNOON-${order._id}`);
      if (awbResponse?.printAWBURL || awbResponse?.awbUrl) {
        const awbUrl = awbResponse.printAWBURL || awbResponse.awbUrl;
        order.shipping.awbUrl = awbUrl;
        await order.save();

        return ApiResponse.success(
          res,
          {
            awbUrl: awbUrl,
            trackingUrl: order.shipping.trackingUrl,
          },
          "AWB URL retrieved",
        );
      }
    } catch (err) {
      logger.warn("Could not retrieve AWB from printAWB:", err.message);
    }

    throw new BadRequestError(
      "No AWB available for this order yet. Please try again in a few moments.",
    );
  }

  return ApiResponse.success(
    res,
    {
      awbUrl: order.shipping.awbUrl,
      trackingUrl: order.shipping.trackingUrl,
    },
    "AWB URL retrieved",
  );
});

// @desc    Track shipment
// @route   GET /api/v1/shipping/:orderId/track
const trackShipment = catchAsync(async (req, res, next) => {
  const order = await Order.findById(req.params.orderId);
  if (!order) throw new NotFoundError("Order not found");

  const isBuyer = order.buyer.toString() === req.user._id.toString();
  const isArtist = order.artist.toString() === req.user._id.toString();
  const isAdmin = req.user.role === "admin";

  if (!isBuyer && !isArtist && !isAdmin) {
    throw new UnauthorizedError("Not authorized to track this shipment");
  }

  if (!order.shipping?.otoListId) {
    return ApiResponse.success(
      res,
      {
        status: order.status,
        trackingUrl: order.shipping?.trackingUrl || "",
        deliveryCompanyName: order.shipping?.deliveryCompanyName,
        estimatedDeliveryDate: order.shipping?.estimatedDeliveryDate,
      },
      "No OTO shipment found",
    );
  }

  let otoStatus = null;
  try {
    const statusData = await otoService.getOrderStatus(
      order.shipping.otoListId,
    );

    otoStatus = Array.isArray(statusData) ? statusData[0] : statusData;

    if (otoStatus?.success === false) {
      logger.warn("⚠️ orderStatus returned success=false:", otoStatus);
      otoStatus = null;
    }

    if (otoStatus) {
      let updated = false;

      if (otoStatus.shipmentId && !order.shipping.trackingNumber) {
        order.shipping.trackingNumber = otoStatus.shipmentId;
        updated = true;
      }
      if (otoStatus.trackingUrl && !order.shipping.trackingUrl) {
        order.shipping.trackingUrl = otoStatus.trackingUrl;
        updated = true;
      }
      if (otoStatus.printAWBURL && !order.shipping.awbUrl) {
        order.shipping.awbUrl = otoStatus.printAWBURL;
        updated = true;
      }
      if (otoStatus.deliveryCompany && !order.shipping.carrier) {
        order.shipping.carrier = otoStatus.deliveryCompany;
        updated = true;
      }

      if (updated) {
        await order.save();
        logger.info(`✅ Order ${order._id} updated from orderStatus`);
      }
    }
  } catch (err) {
    logger.warn("⚠️ Could not fetch tracking info from OTO:", err.message);
  }

  return ApiResponse.success(
    res,
    {
      orderId: order._id,
      currentStatus: order.status,
      shipping: {
        carrier: order.shipping.carrier,
        trackingNumber: order.shipping.trackingNumber,
        trackingUrl: order.shipping.trackingUrl,
        awbUrl: order.shipping.awbUrl,
        estimatedDeliveryDate: order.shipping.estimatedDeliveryDate,
        deliveryCompanyName: order.shipping.deliveryCompanyName,
      },
      otoStatus: otoStatus,
    },
    "Shipment tracking retrieved",
  );
});

// @desc    Handle OTO Webhook
// @route   POST /api/v1/webhooks/oto
const handleOTOWebhook = catchAsync(async (req, res, next) => {
  let payload = req.body;

  logger.info("📥 OTO Webhook received");
  logger.info("   Body type:", typeof payload);
  logger.info("   Is Buffer:", Buffer.isBuffer(payload));

  if (Buffer.isBuffer(payload)) {
    try {
      payload = JSON.parse(payload.toString("utf8"));
    } catch (e) {
      logger.error("❌ Could not parse Buffer as JSON");
      return res.status(400).json({ error: "Invalid JSON" });
    }
  } else if (typeof payload === "string") {
    try {
      payload = JSON.parse(payload);
    } catch (e) {
      logger.error("❌ Could not parse string as JSON");
      return res.status(400).json({ error: "Invalid JSON" });
    }
  } else if (typeof payload === "object" && payload !== null) {
    const keys = Object.keys(payload);
    if (keys.length > 0 && keys.every((k) => !isNaN(parseInt(k)))) {
      try {
        const stringValue = Object.values(payload).join("");
        payload = JSON.parse(stringValue);
        logger.info("✅ Recovered from character-spread object");
      } catch (e) {
        logger.error("❌ Could not recover from character-spread object");
        return res.status(400).json({ error: "Invalid JSON" });
      }
    }
  }

  if (!payload || typeof payload !== "object") {
    logger.error("❌ OTO Webhook: Invalid body after parsing");
    return res.status(400).json({ error: "Invalid body" });
  }

  logger.info("📦 Parsed webhook payload:", JSON.stringify(payload, null, 2));

  const {
    orderId,
    otoId,
    status,
    trackingNumber,
    trackingUrl,
    trackingURL,
    brandedTrackingURL,
    printAWBURL,
    dcTrackingNumber,
    shipmentNumber,
  } = payload;


  if (!orderId && !otoId) {
    logger.warn("⚠️ OTO Webhook: No orderId or otoId in payload");
    return res.status(200).json({ received: true });
  }

  let funoonOrderId;
  if (orderId) {
    funoonOrderId = orderId.replace("FUNOON-", "");
  } else if (otoId) {
    const foundOrder = await Order.findOne({
      "shipping.otoShipmentId": String(otoId),
    });
    if (!foundOrder) {
      logger.warn(`⚠️ Order not found for otoId: ${otoId}`);
      return res.status(200).json({ received: true });
    }
    funoonOrderId = foundOrder._id.toString();
  }

  const statusMap = {
    new: "PROCESSING",
    branchAssigned: "PROCESSING",
    assignedToWarehouse: "PROCESSING",
    searchingDriver: "PROCESSING",
    shipmentCreated: "PROCESSING",
    pickedUp: "SHIPPED",
    inTransit: "SHIPPED",
    outForDelivery: "SHIPPED",
    delivered: "DELIVERED",
    returned: "RETURNED",
    cancelled: "CANCELLED",
  };

  const newStatus = statusMap[status];

  if (!newStatus) {
    logger.warn(`⚠️ OTO Webhook: Unknown status "${status}"`);
    return res.status(200).json({ received: true });
  }

  const updateData = { status: newStatus };

  if (trackingNumber) updateData["shipping.trackingNumber"] = trackingNumber;
  if (shipmentNumber) updateData["shipping.trackingNumber"] = shipmentNumber;
  if (dcTrackingNumber) updateData["shipping.otoShipmentId"] = dcTrackingNumber;
  if (otoId) updateData["shipping.otoShipmentId"] = String(otoId);

  const finalTrackingUrl = brandedTrackingURL || trackingURL || trackingUrl;
  if (finalTrackingUrl) updateData["shipping.trackingUrl"] = finalTrackingUrl;
  if (printAWBURL) updateData["shipping.awbUrl"] = printAWBURL;

  if (newStatus === "DELIVERED") {
    updateData["shipping.deliveredAt"] = new Date();
  }

  try {
    const existingOrder = await Order.findById(funoonOrderId);
    const previousStatus = existingOrder?.status;

    const updatedOrder = await Order.findByIdAndUpdate(
      funoonOrderId,
      { $set: updateData },
      { new: true, runValidators: false },
    );

    if (!updatedOrder) {
      logger.warn(`⚠️ Order not found: ${funoonOrderId}`);
      return res.status(200).json({ received: true });
    }

    logger.info(
      `✅ Order ${funoonOrderId} updated via webhook: status=${newStatus}, tracking=${trackingNumber || shipmentNumber || "(none)"}`,
    );

    if (newStatus === "SHIPPED" && previousStatus !== "SHIPPED") {
      eventEmitter.safeEmit(EVENTS.ORDER_SHIPPED, {
        buyerId: updatedOrder.buyer,
        orderId: updatedOrder._id,
        orderNumber: updatedOrder._id.toString().slice(-6).toUpperCase(),
        carrier: updatedOrder.shipping?.deliveryCompanyName || updatedOrder.shipping?.carrier || "شركة الشحن",
      });
    } else if (newStatus === "DELIVERED" && previousStatus !== "DELIVERED") {
      eventEmitter.safeEmit(EVENTS.ORDER_DELIVERED, {
        buyerId: updatedOrder.buyer,
        orderId: updatedOrder._id,
        orderNumber: updatedOrder._id.toString().slice(-6).toUpperCase(),
      });
    }
  } catch (err) {
    logger.error("❌ Error updating order from webhook:", err.message);
  }

  return res.status(200).json({ received: true });
});

module.exports = {
  calculateShipping,
  createShipment,
  getAWBUrl,
  trackShipment,
  handleOTOWebhook,
};
