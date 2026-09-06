const mongoose = require("mongoose");
require("dotenv").config();
const Order = require("../src/models/Order");

async function run() {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: "funoon_dev" });
  console.log("🔌 Connected to DB name:", mongoose.connection.name);

  const total = await Order.countDocuments();
  console.log(`\n📦 Total orders: ${total}\n`);

  // ── Status distribution ──
  const byStatus = await Order.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
  console.log("📊 Status distribution:");
  byStatus.forEach((s) => console.log(`   ${s._id}: ${s.count}`));

  // ── CANCELLED breakdown ──
  console.log("\n--- CANCELLED orders breakdown ---");

  const cancelledWithPaid = await Order.countDocuments({
    status: "CANCELLED",
    "payment.paidAt": { $ne: null, $exists: true },
  });
  console.log(`✅ CANCELLED with paidAt (keep): ${cancelledWithPaid}`);

  const cancelledNullPaid = await Order.countDocuments({
    status: "CANCELLED",
    "payment.paidAt": null,
  });
  console.log(`🗑️  CANCELLED with paidAt=null (delete): ${cancelledNullPaid}`);

  const cancelledNoField = await Order.countDocuments({
    status: "CANCELLED",
    "payment.paidAt": { $exists: false },
  });
  console.log(
    `🗑️  CANCELLED with no paidAt field (delete): ${cancelledNoField}`,
  );

  // ── PENDING_PAYMENT breakdown ──
  console.log("\n--- PENDING_PAYMENT breakdown ---");
  const pending = await Order.countDocuments({ status: "PENDING_PAYMENT" });
  console.log(`⏳ PENDING_PAYMENT total: ${pending}`);

  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const oldPending = await Order.countDocuments({
    status: "PENDING_PAYMENT",
    createdAt: { $lte: cutoff },
  });
  console.log(`🗑️  PENDING_PAYMENT older than 24h: ${oldPending}`);

  // ── Summary ──
  const toDelete = cancelledNullPaid + cancelledNoField + oldPending;
  console.log(`\n💡 Will delete ${toDelete} spam orders in cleanup`);

  await mongoose.disconnect();
  console.log("👋 Done");
}

run().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
