const mongoose = require("mongoose");

const dimensionsSchema = new mongoose.Schema(
  {
    width: { type: Number, required: true, min: 0 }, // cm
    height: { type: Number, required: true, min: 0 }, // cm
    depth: { type: Number, default: 0, min: 0 }, // cm
  },
  { _id: false },
);

const artworkSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [1, "Price must be at least 1 SAR"],
    },
    images: [
      {
        url: { type: String, required: true },
        key: { type: String, required: true },
        order: { type: Number, default: 0 },
      },
    ],
    coverImage: { type: String },
    artist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    dimensions: {
      type: dimensionsSchema,
      required: [true, "Dimensions are required"],
    },
    // Weight in KG 
    weight: {
      type: Number,
      required: [true, "Weight is required"],
      min: [0.1, "Weight must be at least 0.1 KG"],
    },
    shippingType: {
      type: String,
      enum: ["standard", "giant"],
      default: "standard",
    },
    isSold: { type: Boolean, default: false, index: true },
    isActive: { type: Boolean, default: true, index: true },
    viewsCount: { type: Number, default: 0, min: 0 },
    favoritesCount: { type: Number, default: 0, min: 0 },
    category: {
      type: String,
      enum: [
        "painting",
        "drawing",
        "photography",
        "digital",
        "sculpture",
        "mixed",
        "other",
      ],
      default: "other",
    },
    medium: { type: String, trim: true },
    tags: [{ type: String, trim: true, lowercase: true }],
    listedUnderPlan: {
      type: String,
      enum: ["opal_classic", "opal_plus", "opal_prestige"],
    },
  },
  { timestamps: true, optimisticConcurrency: true },
);

artworkSchema.index({ artist: 1, isActive: 1 });
artworkSchema.index({ isSold: 1, isActive: 1 });
artworkSchema.index({ category: 1 });
artworkSchema.index({ price: 1 });
artworkSchema.index({ createdAt: -1 });
artworkSchema.index({ tags: 1 });

// Auto-calculate shipping type and cover image before save
artworkSchema.pre("save", function (next) {
  if (this.dimensions) {
    const maxDim = Math.max(
      this.dimensions.width,
      this.dimensions.height,
      this.dimensions.depth || 0,
    );
    this.shippingType = maxDim > 120 ? "giant" : "standard";
  }
  if (this.images && this.images.length > 0) {
    this.coverImage = this.images[0].url;
  }
  next();
});

module.exports = mongoose.model("Artwork", artworkSchema);
