const mongoose = require("mongoose");
const logger = require("../utils/logger")

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      dbName: "funoon_dev",
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      heartbeatFrequencyMS: 10000,
      maxPoolSize: 10,
      minPoolSize: 2,
      retryWrites: true,
    });
    logger.info(`✅ MongoDB Connected: ${conn.connection.host}`);

    // ─── Migration: تأكيد المستخدمين القدامى (قبل تطبيق نظام OTP) ──────────
    // يُشغَّل مرة واحدة — يُعلّم كل مستخدم لا يوجد عنده حقل emailVerified بـ true
    const User = require("../models/User");
    const result = await User.updateMany(
      { emailVerified: { $exists: false } },
      { $set: { emailVerified: true } },
    );
    if (result.modifiedCount > 0) {
      logger.info(
        `✅ Migration: ${result.modifiedCount} مستخدم قديم تم تأكيد بريدهم تلقائياً`,
      );
    }
    // ─────────────────────────────────────────────────────────────────────────
  } catch (error) {
    logger.error(`❌ DB Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;

