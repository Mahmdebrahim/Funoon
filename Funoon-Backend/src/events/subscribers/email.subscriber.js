const eventEmitter = require("../event-emitter");
const EVENTS = require("../events");
const EmailService = require("../../services/email.service");
const User = require("../../models/User");
const logger = require("../../utils/logger");

const EMAIL_EVENTS = [
  EVENTS.ORDER_PAID,
  EVENTS.ORDER_SHIPPED,
  EVENTS.ARTWORK_REJECTED,
  EVENTS.ARTWORK_SUSPENDED,
  EVENTS.WITHDRAWAL_REQUESTED,
  EVENTS.WITHDRAWAL_REJECTED,
  EVENTS.WITHDRAWAL_PAID,
  EVENTS.SUBSCRIPTION_EXPIRING,
  EVENTS.SUPPORT_MESSAGE_RECEIVED,
];

EMAIL_EVENTS.forEach((event) => {
  eventEmitter.on(event, async (payload) => {
    try {
      switch (event) {
        case EVENTS.ORDER_PAID: {
          const buyer = await User.findById(payload.buyerId).select(
            "name email",
          );
          if (buyer)
            await EmailService.sendOrderConfirmation(buyer, payload.order);
          break;
        }
        case EVENTS.ORDER_SHIPPED: {
          const buyer = await User.findById(payload.buyerId).select(
            "name email",
          );
          if (buyer)
            await EmailService.sendOrderShippedEmail(
              buyer,
              payload.orderNumber,
              payload.carrier,
            );
          break;
        }
        case EVENTS.ARTWORK_REJECTED: {
          const user = await User.findById(payload.artistId).select(
            "name email",
          );
          if (user)
            await EmailService.sendArtworkRejectedEmail(
              user,
              payload.title,
              payload.reason,
            );
          break;
        }
        case EVENTS.ARTWORK_SUSPENDED: {
          const user = await User.findById(payload.artistId).select(
            "name email",
          );
          if (user)
            await EmailService.sendArtworkSuspendedEmail(
              user,
              payload.title,
              payload.reason,
            );
          break;
        }
        case EVENTS.WITHDRAWAL_REQUESTED: {
          const admins = await User.find({ role: "admin" }).select(
            "name email",
          );
          for (const admin of admins) {
            await EmailService.sendWithdrawalRequestedAdminEmail(
              admin,
              payload.userName,
              payload.amount,
            );
          }
          break;
        }
        case EVENTS.WITHDRAWAL_REJECTED:
        case EVENTS.WITHDRAWAL_PAID: {
          const user = await User.findById(payload.userId).select("name email");
          if (user) {
            await EmailService.sendWithdrawalStatusEmail(user, {
              amount: payload.amount,
              status:
                event === EVENTS.WITHDRAWAL_REJECTED ? "REJECTED" : "PAID",
              rejectionReason: payload.reason,
              transferReference: payload.transferReference,
            });
          }
          break;
        }
        case EVENTS.SUBSCRIPTION_EXPIRING: {
          const user = await User.findById(payload.userId).select("name email");
          if (user)
            await EmailService.sendSubscriptionExpiringEmail(
              user,
              payload.daysLeft,
              payload.planLabel,
            );
          break;
        }
        case EVENTS.SUPPORT_MESSAGE_RECEIVED: {
          const admins = await User.find({ role: "admin" }).select(
            "name email",
          );
          for (const admin of admins) {
            await EmailService.sendSupportAdminEmail(admin, payload);
          }
          break;
        }
        default:
          break;
      }
      logger.debug(`[EmailSubscriber] Sent ${event}`);
    } catch (error) {
      logger.error(`[EmailSubscriber] Failed for ${event}: ${error.message}`);
    }
  });
});

logger.info(
  `✅ Email subscriber registered (${EMAIL_EVENTS.length} critical events only)`,
);
