const Order = require("../models/Order");
const logger = require("../utils/logger");

// المدة اللي بعدها الأوردر PENDING_PAYMENT يعتبر expired (بالدقائق)
const EXPIRE_AFTER_MINUTES = Number(process.env.ORDER_EXPIRE_MINUTES || 30);

async function cleanupExpiredOrders() {
  try {
    const cutoff = new Date(Date.now() - EXPIRE_AFTER_MINUTES * 60 * 1000);

    // احذف الأوردرات اللي:
    // - حالتها PENDING_PAYMENT
    // - اتعملت قبل الـ cutoff
    const result = await Order.deleteMany({
      status: "PENDING_PAYMENT",
      createdAt: { $lte: cutoff },
    });

    if (result.deletedCount > 0) {
      logger.info(
        `🗑️ Cleaned up ${result.deletedCount} expired pending orders (older than ${EXPIRE_AFTER_MINUTES} min)`,
      );
    }
  } catch (error) {
    logger.error(`❌ Cleanup job error: ${error.message}`);
  }
}

function startExpiredOrdersCleanupJob() {
  // اشتغل كل 15 دقيقة
  const intervalMs = Number(process.env.CLEANUP_INTERVAL_MS || 15 * 60 * 1000);

  // شغلها مرة في البداية عشان تنضف بسرعة
  cleanupExpiredOrders();

  // ثم دورياً
  setInterval(cleanupExpiredOrders, intervalMs);

  logger.info(
    `🧹 Expired orders cleanup started (every ${intervalMs / 60000} min, expire after ${EXPIRE_AFTER_MINUTES} min)`,
  );
}

module.exports = { startExpiredOrdersCleanupJob, cleanupExpiredOrders };
