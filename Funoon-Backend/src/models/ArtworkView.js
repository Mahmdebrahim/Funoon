const mongoose = require("mongoose");

const artworkViewSchema = new mongoose.Schema(
  {
    artwork: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Artwork",
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    ipAddress: {
      type: String,
      default: null,
    },
    viewedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true },
);

// Indexes
artworkViewSchema.index({ artwork: 1, user: 1 });
artworkViewSchema.index({ artwork: 1, ipAddress: 1 });
artworkViewSchema.index({ viewedAt: 1 }); // للـ analytics

module.exports = mongoose.model("ArtworkView", artworkViewSchema);
