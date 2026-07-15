const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    items: [
      {
        artwork: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Artwork",
          required: true,
        },
        artist: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        priceSnapshot: {
          type: Number,
          required: true,
        },
        shippingCost: {
          type: Number,
          required: true,
        },
        shippingType: {
          type: String,
          enum: ["standard", "giant"],
          required: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Method to automatically remove items that are sold or deactivated
cartSchema.methods.cleanInvalidItems = async function () {
  // Populate artwork data to check status
  await this.populate("items.artwork");
  
  const originalLength = this.items.length;
  
  // Keep only active and unsold artworks
  this.items = this.items.filter(
    (item) => item.artwork && item.artwork.isActive && !item.artwork.isSold
  );

  // If any item was filtered out, save the changes
  if (this.items.length !== originalLength) {
    await this.save();
  }
  return this;
};

module.exports = mongoose.model("Cart", cartSchema);
