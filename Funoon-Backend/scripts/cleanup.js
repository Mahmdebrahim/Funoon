// scripts/cleanup.js
const mongoose = require("mongoose");
require("dotenv").config({ path: "./.env" });

// ✅ الـ Models اللي عندك (عدّل حسب اللي موجود)
const Order = require("../src/models/Order");
const Cart = require("../src/models/Cart");
const Artwork = require("../src/models/Artwork");
const Wallet = require("../src/models/Wallet");
const Transaction = require("../src/models/Transaction");
const RefreshToken = require("../src/models/RefreshToken");
// const Favorite = require("../src/models/Favorite");
// const ProfileView = require("../src/models/ProfileView");

const cleanup = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("🔌 Connected to MongoDB");
    console.log("🧹 Cleaning up testing data...\n");

    // ─── حذف الـ testing data ───
    const orders = await Order.deleteMany({});
    console.log(`🗑️  Orders: ${orders.deletedCount}`);

    const carts = await Cart.deleteMany({});
    console.log(`🗑️  Carts: ${carts.deletedCount}`);

    const transactions = await Transaction.deleteMany({});
    console.log(`🗑️  Transactions: ${transactions.deletedCount}`);

    const tokens = await RefreshToken.deleteMany({});
    console.log(`🗑️  Refresh Tokens: ${tokens.deletedCount}`);

    // const favorites = await Favorite.deleteMany({});
    // console.log(`🗑️  Favorites: ${favorites.deletedCount}`);

    // const views = await ProfileView.deleteMany({});
    // console.log(`🗑️  Profile Views: ${views.deletedCount}`);

    // ─── Reset الـ Artworks (isSold = false) ───
    const artworks = await Artwork.updateMany({}, { isSold: false });
    console.log(`🔄 Artworks reset (isSold=false): ${artworks.modifiedCount}`);

    // ─── Reset الـ Wallets (balance = 0) ───
    const wallets = await Wallet.updateMany(
      {},
      {
        "balance.available": 0,
        "balance.pending": 0,
        totalEarned: 0,
        totalWithdrawn: 0,
      },
    );
    console.log(`🔄 Wallets reset: ${wallets.modifiedCount}`);

    console.log("\n✅ Cleanup done! Database is clean for testing.");
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Cleanup error:", error);
    process.exit(1);
  }
};

cleanup();
