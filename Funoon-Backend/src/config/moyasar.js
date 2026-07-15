module.exports = {
  baseUrl: process.env.MOYASAR_BASE_URL || 'https://api.moyasar.com/v1',
  publishableKey: process.env.MOYASAR_PUBLISHABLE_KEY,
  secretKey: process.env.MOYASAR_SECRET_KEY,
  webhookSecret: process.env.MOYASAR_WEBHOOK_SECRET,
  payoutAccountId: process.env.MOYASAR_PAYOUT_ACCOUNT_ID,
};
