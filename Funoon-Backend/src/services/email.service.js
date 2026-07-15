const { Resend } = require("resend");
const logger = require("../utils/logger");

// تهيئة Resend باستخدام المفتاح من ملف .env
const resend = new Resend(process.env.RESEND_API_KEY);

// دالة مساعدة لتحديد عنوان المرسل (From)
const getFromAddress = () => {
  if (process.env.NODE_ENV === "production" && process.env.RESEND_DOMAIN) {
    return `Funoon.sa <noreply@${process.env.RESEND_DOMAIN}>`;
  }
  // عنوان تجريبي مسموح بيه من Resend لو الدومين لسه متوثقش
  return "Funoon.sa <onboarding@resend.dev>";
};

class EmailService {
  static async sendEmail(to, subject, html) {
    try {
      if (process.env.NODE_ENV === "development") {
        logger.info(
          `[Email Dev Mode] Attempting to send via Resend to: ${to} | Subject: ${subject}`,
        );
      }

      const mailOptions = {
        from: getFromAddress(),
        to,
        subject,
        html,
      };

      // استدعاء Resend
      const response = await resend.emails.send(mailOptions);

      // 1. التحقق من وجود خطأ في الاستجابة (هذا هو السطر السحري الذي كان ينقصنا)
      if (response.error) {
        throw new Error(response.error.message);
      }

      // 2. استخراج الـ ID من المكان الصحيح
      const emailId = response.data?.id;

      logger.info(
        `✅ Email successfully dispatched to ${to} via Resend. ID: ${emailId}`,
      );
      return true;
    } catch (error) {
      logger.error(
        `❌ Email Service dispatch failure to ${to}: ${error.message}`,
      );

      // طباعة تفاصيل الخطأ الكاملة في وضع التطوير لمعرفة السبب الحقيقي
      if (process.env.NODE_ENV === "development") {
        console.error("Resend Error Details:", error);
      }
      return false;
    }
  }

  static async sendWelcomeEmail(user) {
    const subject = "Welcome to Funoon.sa! | مرحباً بك في فُنون";
    const html = `
      <div style="font-family: sans-serif; direction: rtl; text-align: right; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px; background-color: #ffffff;">
        <h2 style="color: #c5a880; margin-top: 0;">مرحباً ${user.name} في منصة فُنون!</h2>
        <p>يسعدنا انضمامك إلينا كـ ${user.role === "artist" ? "فنان" : "مقتني أعمال فنية"}.</p>
        <p>تصفح واكتشف أرقى الأعمال الفنية السعودية.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;"/>
        <p style="direction: ltr; text-align: left; color: #555; font-size: 14px;">Welcome to Funoon.sa! We are thrilled to have you join us as a ${user.role}.</p>
      </div>
    `;
    return this.sendEmail(user.email, subject, html);
  }

  static async sendOrderConfirmation(buyer, order) {
    const subject = `Order Paid Confirmed - #${order._id}`;
    const html = `
      <div style="font-family: sans-serif; direction: ltr; text-align: left; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px; background-color: #ffffff;">
        <h2 style="color: #2e7d32; margin-top: 0;">Thank you for your purchase!</h2>
        <p>Your payment has been successfully processed.</p>
        <p><strong>Order Number:</strong> ${order._id}</p>
        <p><strong>Artwork:</strong> ${order.artworkSnapshot.title}</p>
        <p><strong>Total Amount Paid:</strong> ${order.financials.totalAmount} SAR</p>
        <p>We have notified the artist. You will receive shipping details once shipped.</p>
      </div>
    `;
    return this.sendEmail(buyer.email, subject, html);
  }

  static async sendArtistOrderNotification(artist, order) {
    const subject = "Artwork Sold! | عمل فني جديد تم بيعه";
    const html = `
      <div style="font-family: sans-serif; direction: rtl; text-align: right; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px; background-color: #ffffff;">
        <h2 style="color: #2e7d32; margin-top: 0;">تهانينا! تم بيع عملك الفني: ${order.artworkSnapshot.title}</h2>
        <p><strong>سعر العمل:</strong> ${order.financials.artworkPrice} SAR</p>
        <p><strong>أرباحك (بعد العمولات):</strong> ${order.financials.artistEarning} SAR</p>
        <p>يرجى تجهيز العمل الفني للشحن. سيقوم ممثل شركة سمسا Express باستلام الشحنة قريباً.</p>
      </div>
    `;
    return this.sendEmail(artist.email, subject, html);
  }

  static async sendWithdrawalStatusEmail(user, withdrawal) {
    const subject = `Withdrawal Request Updated - ${withdrawal.status}`;
    const html = `
      <div style="font-family: sans-serif; direction: ltr; text-align: left; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px; background-color: #ffffff;">
        <h2 style="margin-top: 0;">Withdrawal Request Update</h2>
        <p>Your request for a withdrawal of <strong>${withdrawal.amount} SAR</strong> is now <strong>${withdrawal.status}</strong>.</p>
        ${withdrawal.rejectionReason ? `<p style="color: #c62828;"><strong>Reason for rejection:</strong> ${withdrawal.rejectionReason}</p>` : ""}
        ${withdrawal.transferReference ? `<p><strong>Transfer Reference:</strong> ${withdrawal.transferReference}</p>` : ""}
        <p>Thank you for using Funoon.sa.</p>
      </div>
    `;
    return this.sendEmail(user.email, subject, html);
  }

  static async sendSubscriptionActivationEmail(user, plan) {
    const subject = `Subscription Activated - ${plan}`;
    const html = `
      <div style="font-family: sans-serif; direction: ltr; text-align: left; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px; background-color: #ffffff;">
        <h2 style="color: #c5a880; margin-top: 0;">Subscription Activated!</h2>
        <p>Dear ${user.name}, your subscription to plan <strong>${plan.replace("_", " ").toUpperCase()}</strong> is now active.</p>
        <p>You can now upload artworks according to your plan boundaries.</p>
      </div>
    `;
    return this.sendEmail(user.email, subject, html);
  }

  static async sendPasswordResetEmail(user, url) {
    const subject = "Password Reset Link | رابط استعادة كلمة المرور";
    const html = `
      <div style="font-family: sans-serif; direction: rtl; text-align: right; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px; background-color: #ffffff;">
        <h2 style="margin-top: 0;">طلب استعادة كلمة المرور</h2>
        <p>أنت تتلقى هذا البريد الإلكتروني لأنك طلبت استعادة كلمة المرور. اضغط على الزر أدناه لتعيين كلمة مرور جديدة. الرابط صالح لمدة 10 دقائق:</p>
        <div style="margin: 25px 0; text-align: center;">
          <a href="${url}" style="background-color: #c5a880; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">استعادة كلمة المرور</a>
        </div>
        <p style="font-size: 12px; color: #777; margin-top: 30px;">إذا لم تطلب هذا، يرجى تجاهل هذا البريد الإلكتروني.</p>
      </div>
    `;
    return this.sendEmail(user.email, subject, html);
  }
}

module.exports = EmailService;
