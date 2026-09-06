const crypto = require("crypto");
const logger = require("./logger");

const verifyMoyasarSignature = (rawBody, signature) => {
  const secret = process.env.MOYASAR_WEBHOOK_SECRET;

  if (!secret) {
    logger.warn(
      "⚠️ MOYASAR_WEBHOOK_SECRET not set — skipping signature verification",
    );
    return true; // development mode
  }

  if (!signature) {
    logger.warn("🚨 No signature header found in Moyasar webhook");
    return false;
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("hex");

  try {
    // ✅ timingSafeEqual يمنع timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected),
    );
  } catch {
    logger.error("🚨 Signature comparison failed");
    return false;
  }
};

module.exports = { verifyMoyasarSignature };
