const EVENTS = {
  // Auth
  USER_REGISTERED: "user:registered",
  PASSWORD_RESET: "user:password_reset",

  // Artworks
  ARTWORK_SUBMITTED: "artwork:submitted",
  ARTWORK_UPDATED_NEEDS_REVIEW: "artwork:updated_needs_review",
  ARTWORK_APPROVED: "artwork:approved",
  ARTWORK_REJECTED: "artwork:rejected",
  ARTWORK_SUSPENDED: "artwork:suspended",

  // Orders
  ORDER_CREATED: "order:created",
  ORDER_PAID: "order:paid",
  ORDER_SHIPPED: "order:shipped",
  ORDER_DELIVERED: "order:delivered",
  ORDER_FUNDS_RELEASED: "order:funds_released",

  // Withdrawals
  WITHDRAWAL_REQUESTED: "withdrawal:requested",
  WITHDRAWAL_APPROVED: "withdrawal:approved",
  WITHDRAWAL_REJECTED: "withdrawal:rejected",
  WITHDRAWAL_PAID: "withdrawal:paid",

  // Subscriptions
  SUBSCRIPTION_EXPIRING: "subscription:expiring",
  SUBSCRIPTION_PURCHASED: "subscription:purchased",

  // Support
  SUPPORT_MESSAGE_RECEIVED: "support:message_received",
};

module.exports = EVENTS;
