const mongoose = require('mongoose');

const withdrawalSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
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
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'PAID', 'FAILED'],
      default: 'PENDING',
      index: true,
    },
    bankDetails: {
      iban:          { type: String, required: true },
      accountHolder: { type: String, required: true },
      bankName:      { type: String, required: true },
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
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Withdrawal', withdrawalSchema);
