const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        "BAN_USER",
        "UNBAN_USER",
        "HOLD_ORDER",
        "UNHOLD_ORDER",
        "RELEASE_FUNDS",
        "VERIFY_BANK",
        "REJECT_BANK",
        "APPROVE_WITHDRAWAL",
        "REJECT_WITHDRAWAL",
        "MARK_WITHDRAWAL_PAID",
        "APPROVE_ARTWORK",
        "REJECT_ARTWORK",
        "SUSPEND_ARTWORK",
        "UNSUSPEND_ARTWORK",
      ],
    },
    targetType: { type: String, required: true }, // "user" | "order" | "withdrawal" | "bankAccount"
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
    details: { type: mongoose.Schema.Types.Mixed },
    ip: { type: String },
  },
  { timestamps: true },
);

auditLogSchema.index({ admin: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ targetType: 1, targetId: 1 });

module.exports = mongoose.model("AuditLog", auditLogSchema);
