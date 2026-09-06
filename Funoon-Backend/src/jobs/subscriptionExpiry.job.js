const cron = require("node-cron");
const User = require("../models/User");
const eventEmitter = require("../events/event-emitter");
const EVENTS = require("../events/events");
const logger = require("../utils/logger");

/**
 * ✅ Run Daily Subscription Expiring Check
 * Checks active subscriptions expiring in exactly 7, 3, or 1 days
 * and emits SUBSCRIPTION_EXPIRING event for each matching user.
 */
async function runSubscriptionExpiringJob() {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const users = await User.find({
      "subscription.isActive": true,
      "subscription.endDate": { $ne: null },
    });

    logger.info(`⏰ Checking subscription expirations for ${users.length} user(s)...`);

    for (const user of users) {
      if (!user.subscription?.endDate) continue;

      const endDate = new Date(user.subscription.endDate);
      const endStart = new Date(endDate);
      endStart.setHours(0, 0, 0, 0);

      const diffMs = endStart.getTime() - todayStart.getTime();
      const daysLeft = Math.round(diffMs / (1000 * 60 * 60 * 24));

      if ([7, 3, 1].includes(daysLeft)) {
        const planConfig = User.PLAN_CONFIG?.[user.subscription.plan];
        const planLabel = planConfig?.labelAr || user.subscription.plan;

        eventEmitter.safeEmit(EVENTS.SUBSCRIPTION_EXPIRING, {
          userId: user._id,
          daysLeft,
          planLabel,
        });

        logger.info(
          `🔔 Subscription expiring event emitted for user ${user._id} (${daysLeft} days left)`,
        );
      }
    }
  } catch (error) {
    logger.error(`❌ Subscription expiring job error: ${error.message}`);
  }
}

/**
 * ✅ Schedule Subscription Expiring Cron Job (Daily at 9:00 AM)
 */
function startSubscriptionExpiringJob() {
  // Run daily at 9:00 AM
  cron.schedule("0 9 * * *", runSubscriptionExpiringJob);
  logger.info("⏰ Subscription expiring cron job scheduled (daily at 9:00 AM)");
}

module.exports = {
  startSubscriptionExpiringJob,
  runSubscriptionExpiringJob,
};
