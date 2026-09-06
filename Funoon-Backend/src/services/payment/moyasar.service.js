const axios = require("axios");
const crypto = require("crypto");

class MoyasarService {
  constructor() {
    this.secretKey = process.env.MOYASAR_SECRET_KEY;
    this.baseUrl = process.env.MOYASAR_BASE_URL || "https://api.moyasar.com/v1";
    this.webhookSecret = process.env.MOYASAR_WEBHOOK_SECRET;

    // HTTP Basic Auth: secretKey كـ username، password فاضل
    const token = Buffer.from(`${this.secretKey}:`).toString("base64");
    this.authHeader = `Basic ${token}`;

    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      headers: {
        Authorization: this.authHeader,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
  }

  // ─── Invoices ─────────────────────────────────────────────────────────────

  // Invoice = صفحة دفع جاهزة بـ URL نبعتها للـ Frontend
  async createInvoice(invoiceData) {
    try {
      const payload = {
        amount: invoiceData.amount,
        currency: "SAR",
        description: invoiceData.description,
        callback_url: invoiceData.callbackUrl,
        success_url: invoiceData.successUrl,
        back_url: invoiceData.backUrl,
        metadata: invoiceData.metadata,
        expired_at: invoiceData.expired_at,
      };

      console.log(
        "📤 Moyasar createInvoice payload:",
        JSON.stringify(payload, null, 2),
      );

      const response = await this.axiosInstance.post("/invoices", payload);

      console.log(
        "📥 Moyasar createInvoice response:",
        JSON.stringify(response.data, null, 2),
      );
      return response.data;
    } catch (error) {
      console.error(
        "❌ Moyasar createInvoice error:",
        error.response?.data || error.message,
      );
      throw new Error(
        error.response?.data?.message || "Failed to create Moyasar invoice",
      );
    }
  }

  async fetchInvoice(invoiceId) {
    try {
      const response = await this.axiosInstance.get(`/invoices/${invoiceId}`);
      return response.data;
    } catch (error) {
      console.error(
        "❌ Moyasar fetchInvoice error:",
        error.response?.data || error.message,
      );
      throw new Error(
        error.response?.data?.message || "Failed to fetch invoice",
      );
    }
  }

  // Cancel invoice = Moyasar ترفض أي دفع قادم على الـ invoice ده
  async cancelInvoice(invoiceId) {
    if (!invoiceId) return null;
    try {
      const response = await this.axiosInstance.put(
        `/invoices/${invoiceId}/cancel`,
      );
      console.log(`✅ Moyasar invoice cancelled: ${invoiceId}`);
      return response.data;
    } catch (error) {
      // مش نرمي — الـ webhook safety net هيغطي لو الـ cancel فشل
      console.warn(
        `⚠️ Failed to cancel invoice ${invoiceId}:`,
        error.response?.data?.message || error.message,
      );
      return null;
    }
  }

  // ─── Payments ─────────────────────────────────────────────────────────────

  async fetchPayment(paymentId) {
    try {
      const response = await this.axiosInstance.get(`/payments/${paymentId}`);
      return response.data;
    } catch (error) {
      console.error(
        "❌ Moyasar fetchPayment error:",
        error.response?.data || error.message,
      );
      throw new Error(
        error.response?.data?.message || "Failed to fetch payment",
      );
    }
  }

  // ─── Payouts ──────────────────────────────────────────────────────────────
  // تحويل فلوس للفنان على IBAN بتاعه
  // محتاج ENABLE_AUTO_PAYOUT=true في الـ .env

  async createPayout(payoutData) {
    if (process.env.ENABLE_AUTO_PAYOUT !== "true") {
      console.log(
        "⚠️ Auto payout disabled. Set ENABLE_AUTO_PAYOUT=true to enable.",
      );
      return null;
    }

    try {
      const payload = {
        amount: payoutData.amount, // بالهللات
        currency: "SAR",
        description: payoutData.description,
        destination: {
          type: "iban",
          name: payoutData.accountHolder,
          iban: payoutData.iban,
        },
        metadata: payoutData.metadata || {},
      };

      console.log(
        "📤 Moyasar createPayout payload:",
        JSON.stringify(payload, null, 2),
      );

      const response = await this.axiosInstance.post("/payouts", payload);
      return response.data;
    } catch (error) {
      console.error(
        "❌ Moyasar createPayout error:",
        error.response?.data || error.message,
      );
      throw new Error(
        error.response?.data?.message || "Failed to create payout",
      );
    }
  }

  async fetchPayout(payoutId) {
    try {
      const response = await this.axiosInstance.get(`/payouts/${payoutId}`);
      return response.data;
    } catch (error) {
      console.error(
        "❌ Moyasar fetchPayout error:",
        error.response?.data || error.message,
      );
      throw new Error(
        error.response?.data?.message || "Failed to fetch payout",
      );
    }
  }

  // ─── Refunds ──────────────────────────────────────────────────────────────
  // Refund = إرجاع فلوس للعميل على نفس الـ payment
  // المبلغ بالهللات (SAR * 100)

  async refundPayment(paymentId, refundData = {}) {
    try {
      const payload = {
        amount: refundData.amount, // بالهللات (لو مش موجود = full refund)
        reason: refundData.reason || "Order cancelled by buyer",
      };

      console.log(
        "📤 Moyasar refundPayment payload:",
        JSON.stringify(payload, null, 2),
      );

      const response = await this.axiosInstance.post(
        `/payments/${paymentId}/refund`,
        payload,
      );

      console.log(
        "📥 Moyasar refundPayment response:",
        JSON.stringify(response.data, null, 2),
      );
      return response.data;
    } catch (error) {
      console.error(
        "❌ Moyasar refundPayment error:",
        error.response?.data || error.message,
      );
      throw new Error(
        error.response?.data?.message || "Failed to process refund",
      );
    }
  }

  // ─── Webhook Signature Verification ───────────────────────────────────────
  // Moyasar بتبعت HMAC-SHA256 في header: x-moyasar-signature
  // لازم نتحقق منها عشان نتأكد إن الـ request جاي من Moyasar فعلاً

  verifyWebhookSignature(rawBody, signature) {
    if (!signature) {
      console.warn("⚠️ No signature provided in webhook");
      return false;
    }

    if (!this.webhookSecret) {
      console.warn("⚠️ MOYASAR_WEBHOOK_SECRET not set, skipping verification");
      return true; // في التطوير بنسمح بدون secret
    }

    try {
      const body = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody);
      const hmac = crypto.createHmac("sha256", this.webhookSecret);
      const digest = hmac.update(body).digest("hex");

      // Timing-safe comparison
      const sigBuffer = Buffer.from(signature, "hex");
      const digestBuffer = Buffer.from(digest, "hex");

      if (sigBuffer.length !== digestBuffer.length) return false;

      return crypto.timingSafeEqual(sigBuffer, digestBuffer);
    } catch (err) {
      console.error("❌ Signature verification error:", err.message);
      return false;
    }
  }
}

module.exports = new MoyasarService();
