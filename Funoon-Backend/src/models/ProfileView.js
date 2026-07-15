// src/models/ProfileView.js
const mongoose = require("mongoose");

const profileViewSchema = new mongoose.Schema(
  {
    profile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // ✅ بروفايل المستخدم (الفنان)
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // الزائر (لو مسجل دخول)
    },
    ipAddress: {
      type: String,
    },
    viewedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 },
    },
  },
  { timestamps: true },
);

// Indexes
profileViewSchema.index({ profile: 1, viewedAt: -1 });
profileViewSchema.index(
  { profile: 1, user: 1, expiresAt: 1 },
  { sparse: true, partialFilterExpression: { user: { $exists: true } } },
);
profileViewSchema.index(
  { profile: 1, ipAddress: 1, expiresAt: 1 },
  { sparse: true, partialFilterExpression: { ipAddress: { $exists: true } } },
);

module.exports = mongoose.model("ProfileView", profileViewSchema);
