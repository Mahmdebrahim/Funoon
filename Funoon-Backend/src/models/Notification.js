const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        "ARTWORK_APPROVED",
        "ARTWORK_REJECTED",
        "ARTWORK_SUSPENDED",
        "ARTWORK_SUBMITTED",
        "ARTWORK_UPDATED_NEEDS_REVIEW",
        "WITHDRAWAL_REQUESTED",
        "ORDER_CREATED",
        "ORDER_PAID",
        "ORDER_SHIPPED",
        "ORDER_DELIVERED",
        "ORDER_FUNDS_RELEASED",
        "WITHDRAWAL_APPROVED",
        "WITHDRAWAL_REJECTED",
        "WITHDRAWAL_PAID",
        "SUBSCRIPTION_EXPIRING",
        "SUPPORT_MESSAGE_RECEIVED",
        "GENERAL",
      ],
      index: true,
    },
    title: { type: String, required: true },
    body: { type: String, required: true },
    icon: { type: String, default: "bell" }, // lucide icon name
    data: { type: mongoose.Schema.Types.Mixed, default: {} }, // route + context
    isRead: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
);

// Index للسرعة: آخر الإشعارات للمستخدم
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, isRead: 1 });

// Auto-delete after 90 days (TTL)
notificationSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 90 * 24 * 60 * 60 },
);

module.exports = mongoose.model("Notification", notificationSchema);
