require("dotenv").config();
const mongoose = require("mongoose");
const Withdrawal = require("../src/models/Withdrawal");

async function run() {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: "funoon_dev" });
  console.log("🔌 Connected");

  // أي طلب PAID ومفيهوش paidAt → نختمه بـ updatedAt (أقرب وقت حقيقي عندنا)
  const res = await Withdrawal.updateMany(
    { status: "PAID", paidAt: { $exists: false } },
    [{ $set: { paidAt: "$updatedAt" } }],
  );

  console.log(`✅ Fixed ${res.modifiedCount} withdrawal(s)`);
  await mongoose.disconnect();
}

run().catch((e) => {
  console.error("❌", e);
  process.exit(1);
});
