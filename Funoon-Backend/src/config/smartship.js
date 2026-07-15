module.exports = {
  apiKey: process.env.SMARTSHIP_API_KEY,
  apiSecret: process.env.SMARTSHIP_API_SECRET,
  baseUrl: process.env.SMARTSHIP_BASE_URL || 'https://api.smartship.com',
  webhookSecret: process.env.SMARTSHIP_WEBHOOK_SECRET,
};
