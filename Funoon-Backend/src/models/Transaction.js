const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    wallet: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Wallet',
      required: true,
      index:    true,
    },
    user: {
      type:  mongoose.Schema.Types.ObjectId,
      ref:   'User',
      index: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  'Order',
    },
    withdrawal: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  'Withdrawal',
    },

    type: {
      type:     String,
      enum:     [
        'CREDIT_SALE',         // Earning from artwork sale
        'CREDIT_RELEASE',      // Pending → Available on order completion
        'DEBIT_WITHDRAWAL',    // Withdrawal processed
        'REFUND',              // Order refunded
        'ADJUSTMENT',          // Admin manual adjustment
      ],
      required: true,
      index:    true,
    },

    amount:   { type: Number, required: true },
    currency: { type: String, default: 'SAR' },

    // Balance snapshot after this transaction
    balanceAfter: {
      available: { type: Number },
      pending:   { type: Number },
    },

    status: {
      type:    String,
      enum:    ['PENDING', 'COMPLETED', 'FAILED'],
      default: 'COMPLETED',
      index:   true,
    },

    description: { type: String, trim: true },
    metadata:    { type: mongoose.Schema.Types.Mixed }, // Extra info if needed
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

transactionSchema.index({ wallet: 1, createdAt: -1 });
transactionSchema.index({ type: 1, status: 1 });
transactionSchema.index({ order: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
