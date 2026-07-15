// src/models/BankAccount.js
const mongoose = require("mongoose");

const bankAccountSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // فنان واحد = حساب واحد
    },
    accountHolder: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 100,
    },
    iban: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      validate: {
        validator: (v) => /^SA\d{22}$/.test(v),
        message: "Invalid Saudi IBAN format (SA + 22 digits)",
      },
    },
    bankName: {
      type: String,
      required: true,
      trim: true,
    },
    isVerified: {
      type: Boolean,
      default: false, // الأدمن هو اللي بيؤكد
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
bankAccountSchema.index({ user: 1 });
bankAccountSchema.index({ iban: 1 });

module.exports = mongoose.model("BankAccount", bankAccountSchema);
