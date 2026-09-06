// src/models/Order.js
const mongoose = require("mongoose");

const addressSnapshotSchema = new mongoose.Schema(
  {
    name: String,
    phone: String,
    street: String,
    city: String,
    district: String,
    zipCode: String,
    country: String,
    buildingNo: String,
    shortAddressCode: String,
    lat: String,
    lon: String,
  },
  { _id: false },
);

const artworkSnapshotSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    coverImage: { type: String },
    price: { type: Number },
    dimensions: {
      width: { type: Number },
      height: { type: Number },
      depth: { type: Number },
      weight: { type: Number, default: 2 },
    },
    shippingType: {
      type: String,
      enum: ["standard", "giant"],
    },
  },
  { _id: false },
);

// ── Item-level financials ─────────────────────────────
const itemFinancialsSchema = new mongoose.Schema(
  {
    artworkPrice: { type: Number, required: true },
    commissionRate: { type: Number, required: true },
    platformCommission: { type: Number, required: true },
    artistEarning: { type: Number, required: true },
  },
  { _id: false },
);

// ── Single item inside an order ───────────────────────
const orderItemSchema = new mongoose.Schema(
  {
    artwork: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Artwork",
      required: true,
    },
    artworkSnapshot: {
      type: artworkSnapshotSchema,
      required: true,
    },
    financials: {
      type: itemFinancialsSchema,
      required: true,
    },
  },
  { _id: false },
);

// ── Main Order Schema ─────────────────────────────────
const orderSchema = new mongoose.Schema(
  {
    // كل Order = مشتري واحد + فنان واحد + كذا لوحة
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    artist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // اللوحات (كذا لوحة من نفس الفنان)
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (v) => v.length > 0,
        message: "Order must have at least one item",
      },
    },

    status: {
      type: String,
      enum: [
        "PENDING_PAYMENT",
        "PAID",
        "PROCESSING",
        "SHIPPED",
        "DELIVERED",
        "COMPLETED",
        "CANCELLED",
        "DISPUTED",
        "REFUNDED",
      ],
      default: "PENDING_PAYMENT",
      index: true,
    },

    // ── Order-level financials (إجمالي الأوردر) ──────
    financials: {
      subtotal: { type: Number, required: true },
      shippingCost: { type: Number, required: true },
      totalCommission: { type: Number, required: true },
      totalArtistEarning: { type: Number, required: true },
      totalAmount: { type: Number, required: true },
      currency: { type: String, default: "SAR" },
      platformShippingExpense: { type: Number, default: 0 },
    },

    // ── Payment ───────────────────────────────────────
    payment: {
      provider: { type: String, default: "Moyasar" },
      paymentId: { type: String },
      invoiceId: { type: String }, // ✅ مهم - Moyasar invoice ID
      method: { type: String },
      paidAt: { type: Date },
    },

    // ── Shipping ──────────────────────────────────────
    shipping: {
      deliveryOptionId: { type: Number },
      deliveryCompanyName: { type: String },
      deliveryOptionName: { type: String },

      // ❌ شيل: estimatedDeliveryDate: { type: String },
      // ✅ بدالها الاسم الصح المطابق لـ response بتاع OTO فعليًا
      avgDeliveryTime: { type: String }, // "1to3WorkingDays"
      pickupCutOffTime: { type: String }, // "11:00"
      maxFreeWeight: { type: Number }, // 15
      extraWeightPerKg: { type: Number }, // 2
      returnFee: { type: Number }, // 22 - داخلي، مش للعرض للمشتري بالضرورة

      pickupDropoff: { type: String },
      deliveryType: { type: String },
      serviceType: { type: String },
      logo: { type: String },

      buyerAddress: { type: addressSnapshotSchema },
      artistAddress: { type: addressSnapshotSchema },

      carrier: { type: String },
      trackingNumber: { type: String },
      trackingUrl: { type: String },
      awbUrl: { type: String },
      otoListId: { type: String },
      otoShipmentId: { type: String },

      shippedAt: { type: Date },
      deliveredAt: { type: Date },
      estimatedDelivery: { type: Date },
    },

    // ═══ Fund Release & Holds ═══
    onHold: {
      type: Boolean,
      default: false,
      index: true,
    },
    holdReason: {
      type: String,
      trim: true,
    },
    fundsReleased: {
      type: Boolean,
      default: false,
    },

    // ── Cancellation ────────────────────────────────
    cancellationReason: {
      type: String,
      trim: true,
      maxlength: [500, "Cancellation reason is too long"],
    },
    cancelledBy: {
      type: String,
      enum: ["buyer", "artist", "system", "admin"],
    },
    refundStatus: {
      type: String,
      enum: ["NONE", "PENDING", "COMPLETED", "FAILED"],
      default: "NONE",
    },
    refundRequestedAt: {
      type: Date,
    },

    adminOverrideBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    adminOverrideAt: { type: Date, default: null },
    adminOverrideReason: { type: String, default: null },

    // ── Timestamps ────────────────────────────────────
    completedAt: { type: Date },
    autoCompletedAt: { type: Date },
    cancelledAt: { type: Date },
  },
  {
    timestamps: true,
    optimisticConcurrency: true,
  },
);

// ── Indexes ───────────────────────────────────────────
orderSchema.index({ buyer: 1, status: 1 });
orderSchema.index({ artist: 1, status: 1 });
orderSchema.index({
  status: 1,
  "shipping.shippedAt": 1,
});
orderSchema.index({ "payment.paymentId": 1 });
orderSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Order", orderSchema);
