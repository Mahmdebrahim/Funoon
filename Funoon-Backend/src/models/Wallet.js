const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    balance: {
      available: { type: Number, default: 0, min: 0 },
      pending: { type: Number, default: 0, min: 0 },
    },
    totalEarned: { type: Number, default: 0, min: 0 },
    totalWithdrawn: { type: Number, default: 0, min: 0 },
  },
  {
    timestamps: true,
  },
);

// Credit pending balance when a sale is made
walletSchema.methods.creditPending = async function (amount, session) {
  this.balance.pending += amount;
  this.totalEarned += amount;
  return await this.save({ session });
};

// خصم من الـ pending (عكس creditPending) — عند الـ refund
// خصم من الـ pending (عكس creditPending) — عند الـ refund
walletSchema.methods.debitPending = async function (amount, session) {
  if (this.balance.pending < amount) {
    throw new Error("Insufficient pending balance for refund");
  }
  this.balance.pending -= amount;
  this.totalEarned = Math.max(0, this.totalEarned - amount); // ✅ عكس creditPending
  return session ? this.save({ session }) : this.save();
};

// Release pending to available when delivery is confirmed
walletSchema.methods.releaseToAvailable = async function (amount, session) {
  if (this.balance.pending < amount) {
    throw new Error("Insufficient pending balance to release");
  }
  this.balance.pending = Math.max(0, this.balance.pending - amount);
  this.balance.available += amount;
  return await this.save({ session });
};

// Debit available when withdrawal is requested
walletSchema.methods.debitAvailable = async function (amount, session) {
  if (this.balance.available < amount) {
    throw new Error("Insufficient available balance");
  }
  this.balance.available = Math.max(0, this.balance.available - amount);
  this.totalWithdrawn += amount;
  return await this.save({ session });
};

module.exports = mongoose.model("Wallet", walletSchema);



