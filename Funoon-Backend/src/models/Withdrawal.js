const mongoose = require("mongoose");

const withdrawalSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 50,
    },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED", "PAID", "FAILED"],
      default: "PENDING",
      index: true,
    },
    bankDetails: {
      iban: { type: String, required: true },
      accountHolder: { type: String, required: true },
      bankName: { type: String, required: true },
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
    transferReference: {
      type: String,
      trim: true,
    },
    // Moyasar Payout API tracking
    payoutId: {
      type: String,
      index: true,
    },
    payoutStatus: {
      type: String,
    },
    moyasarResponse: {
      type: mongoose.Schema.Types.Mixed,
    },
    // ═══ دورة حياة السحب (Audit Trail) ═══
    approvedAt: { type: Date },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    paidAt: { type: Date }, // ✅ إمتى اتحوّل فعلاً
    paidBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    rejectedAt: { type: Date },
    rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Withdrawal", withdrawalSchema);
