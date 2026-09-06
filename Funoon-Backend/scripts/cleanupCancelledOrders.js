const mongoose = require("mongoose");
require("dotenv").config();
const Order = require("../src/models/Order");

async function run() {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: "funoon_dev" });
  console.log("🔌 Connected to:", mongoose.connection.name);

  // ── 1. احذف CANCELLED اللي مالهاش paidAt (محاولات فاشلة) ──
  const spamCancelled = await Order.deleteMany({
    status: "CANCELLED",
    $or: [{ "payment.paidAt": null }, { "payment.paidAt": { $exists: false } }],
  });
  console.log(`✅ Deleted ${spamCancelled.deletedCount} spam cancelled orders`);

  // ── 2. احذف PENDING_PAYMENT القديمة (> 24h) لو موجودة ──
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const oldPending = await Order.deleteMany({
    status: "PENDING_PAYMENT",
    createdAt: { $lte: cutoff },
  });
  console.log(`✅ Deleted ${oldPending.deletedCount} old pending orders`);

  // ── 3. التحقق من النتيجة ──
  const remaining = await Order.countDocuments();
  console.log(`\n📦 Remaining orders in DB: ${remaining}`);

  const byStatus = await Order.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
  console.log("📊 New status distribution:");
  byStatus.forEach((s) => console.log(`   ${s._id}: ${s.count}`));

  await mongoose.disconnect();
  console.log("\n👋 Done");
}

run().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
