const { Resend } = require("resend");
const logger = require("../utils/logger");

// تهيئة Resend باستخدام المفتاح من ملف .env
const resend = new Resend(process.env.RESEND_API_KEY);

// دالة مساعدة لتحديد عنوان المرسل (From)
const getFromAddress = () => {
  if (process.env.NODE_ENV === "production" && process.env.RESEND_DOMAIN) {
    return `Funoon.sa <noreply@${process.env.RESEND_DOMAIN}>`;
  }

  return "Funoon.sa <onboarding@resend.dev>";
};

const BRAND = {
  primary: "#5A1E2B",
  primaryDark: "#431620",
  gold: "#C5A880",
  bg: "#F6F3EF",
  card: "#FEFEFE",
  text: "#2B2B2B",
  muted: "#8A8580",
  border: "#EAE4DC",
};

const baseTemplate = (content, accent = BRAND.primary) => `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>فُنون | Funoon.sa</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.bg};font-family:'Segoe UI',Tahoma,Arial,sans-serif;-webkit-text-size-adjust:100%;">
  <center style="width:100%;background:${BRAND.bg};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:28px 12px;">
      <tr><td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- ═══ Header نبيتي ═══ -->
          <tr>
            <td style="background:${accent};border-radius:16px 16px 0 0;padding:22px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
                <td style="color:#FDFDFD;font-size:21px;font-weight:bold;">
                  فُنون <span style="color:${BRAND.gold};font-size:18px;">✦</span>
                  <span style="font-size:12px;color:#E9DCCE;font-weight:normal;">Funoon.sa</span>
                </td>
              </tr></table>
            </td>
          </tr>

          <!-- ═══ خط ذهبي فاصل ═══ -->
          <tr><td style="background:${BRAND.gold};height:4px;font-size:0;line-height:0;">&nbsp;</td></tr>

          <!-- ═══ المحتوى ═══ -->
          <tr>
            <td style="background:${BRAND.card};padding:36px 32px;border-right:1px solid ${BRAND.border};border-left:1px solid ${BRAND.border};color:${BRAND.text};font-size:14px;line-height:1.9;">
              ${content}
            </td>
          </tr>

          <!-- ═══ Footer ══ -->
          <tr>
            <td style="background:#EFEAE3;border-radius:0 0 16px 16px;padding:20px 32px;border:1px solid ${BRAND.border};border-top:0;">
              <p style="margin:0;color:${BRAND.muted};font-size:11px;line-height:1.8;text-align:center;">
                منصة فُنون — عرض وبيع الأعمال الفنية السعودية<br>
                بريد تلقائي، يرجى عدم الرد عليه
              </p>
            </td>
          </tr>

        </table>
      </td></tr>
    </table>
  </center>
</body>
</html>`;

const btn = (href, label, color = BRAND.primary) => `
  <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:28px auto 6px;">
    <tr>
      <td style="background:${color};border-radius:10px;">
        <a href="${href}" style="display:inline-block;padding:13px 38px;color:#FDFDFD;text-decoration:none;font-weight:bold;font-size:14px;">${label}</a>
      </td>
    </tr>
  </table>`;

const escapeHtml = (str) =>
  String(str ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c],
  );

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

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

      const response = await resend.emails.send(mailOptions);

      if (response.error) {
        throw new Error(response.error.message);
      }

      const emailId = response.data?.id;

      logger.info(
        `✅ Email successfully dispatched to ${to} via Resend. ID: ${emailId}`,
      );
      return true;
    } catch (error) {
      logger.error(
        `❌ Email Service dispatch failure to ${to}: ${error.message}`,
      );

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
        <h2 style="color: #c5a880; margin-top: 0;">مرحباً ${escapeHtml(user.name)} في منصة فُنون!</h2>
        <p>يسعدنا انضمامك إلينا كـ ${escapeHtml(user.role === "artist" ? "فنان" : "مقتني أعمال فنية")}.</p>
        <p>تصفح واكتشف أرقى الأعمال الفنية السعودية.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;"/>
        <p style="direction: ltr; text-align: left; color: #555; font-size: 14px;">Welcome to Funoon.sa! We are thrilled to have you join us as a ${escapeHtml(user.role)}.</p>
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
        <p><strong>Order Number:</strong> ${escapeHtml(order._id)}</p>
        <p><strong>Artwork:</strong> ${escapeHtml(order.artworkSnapshot.title)}</p>
        <p><strong>Total Amount Paid:</strong> ${escapeHtml(order.financials.totalAmount)} SAR</p>
        <p>We have notified the artist. You will receive shipping details once shipped.</p>
      </div>
    `;
    return this.sendEmail(buyer.email, subject, html);
  }

  static async sendArtistOrderNotification(artist, order) {
    const subject = "Artwork Sold! | عمل فني جديد تم بيعه";
    const html = `
      <div style="font-family: sans-serif; direction: rtl; text-align: right; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px; background-color: #ffffff;">
        <h2 style="color: #2e7d32; margin-top: 0;">تهانينا! تم بيع عملك الفني: ${escapeHtml(order.artworkSnapshot.title)}</h2>
        <p><strong>سعر العمل:</strong> ${escapeHtml(order.financials.artworkPrice)} SAR</p>
        <p><strong>أرباحك (بعد العمولات):</strong> ${escapeHtml(order.financials.artistEarning)} SAR</p>
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
        <p>Your request for a withdrawal of <strong>${escapeHtml(withdrawal.amount)} SAR</strong> is now <strong>${escapeHtml(withdrawal.status)}</strong>.</p>
        ${withdrawal.rejectionReason ? `<p style="color: #c62828;"><strong>Reason for rejection:</strong> ${escapeHtml(withdrawal.rejectionReason)}</p>` : ""}
        ${withdrawal.transferReference ? `<p><strong>Transfer Reference:</strong> ${escapeHtml(withdrawal.transferReference)}</p>` : ""}
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
        <p>Dear ${escapeHtml(user.name)}, your subscription to plan <strong>${escapeHtml(plan.replace("_", " ").toUpperCase())}</strong> is now active.</p>
        <p>You can now upload artworks according to your plan boundaries.</p>
      </div>
    `;
    return this.sendEmail(user.email, subject, html);
  }

  static async sendPasswordResetEmail(user, url) {
    const safeUrl = escapeHtml(url);
    const subject = "Password Reset Link | رابط استعادة كلمة المرور";
    const html = `
      <div style="font-family: sans-serif; direction: rtl; text-align: right; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px; background-color: #ffffff;">
        <h2 style="margin-top: 0;">طلب استعادة كلمة المرور</h2>
        <p>أنت تتلقى هذا البريد الإلكتروني لأنك طلبت استعادة كلمة المرور. اضغط على الزر أدناه لتعيين كلمة مرور جديدة. الرابط صالح لمدة 10 دقائق:</p>
        <div style="margin: 25px 0; text-align: center;">
          <a href="${safeUrl}" style="background-color: #c5a880; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">استعادة كلمة المرور</a>
        </div>
        <p style="font-size: 12px; color: #777; margin-top: 30px;">إذا لم تطلب هذا، يرجى تجاهل هذا البريد الإلكتروني.</p>
      </div>
    `;
    return this.sendEmail(user.email, subject, html);
  }

  // ═══════════════════════════════════════════════════
  //* Artwork Moderation
  // ═══════════════════════════════════════════════════
  static async sendArtworkApprovedEmail(user, title) {
    const subject = `تم اعتماد لوحتك "${escapeHtml(title)}"`;
    const html = baseTemplate(`
      <h2 style="margin-top:0;color:#2e7d32;">تهانينا يا ${escapeHtml(user.name)}! 🎉</h2>
      <p style="color:#444;line-height:1.8;">تم اعتماد لوحتك <strong>"${escapeHtml(title)}"</strong> وهي الآن ظاهرة لكل الزوار في المعرض.</p>
      ${btn("http://localhost:5173/dashboard/artworks", "عرض لوحاتي")}
    `);
    return this.sendEmail(user.email, subject, html);
  }

  static async sendArtworkRejectedEmail(user, title, reason) {
    const subject = `تحديث بخصوص لوحتك "${escapeHtml(title)}"`;
    const html = baseTemplate(
      `
      <h2 style="margin-top:0;color:#c62828;">مرحباً ${escapeHtml(user.name)}</h2>
      <p style="color:#444;line-height:1.8;">بعد المراجعة، لم نتمكن من اعتماد لوحتك <strong>"${escapeHtml(title)}"</strong>.</p>
      ${reason ? `<div style="background:#fdecea;border:1px solid #f5c6cb;border-radius:8px;padding:14px;margin:16px 0;"><strong style="color:#c62828;">السبب:</strong> <span style="color:#842029;">${escapeHtml(reason)}</span></div>` : ""}
      <p style="color:#444;line-height:1.8;">يمكنك تعديل اللوحة وسيتم إرسالها للمراجعة تلقائياً.</p>
      ${btn("http://localhost:5173/dashboard/artworks", "تعديل اللوحة", "#5a6b7d")}
    `,
      "#c62828",
    );
    return this.sendEmail(user.email, subject, html);
  }

  static async sendArtworkSuspendedEmail(user, title, reason) {
    const subject = `تم إيقاف عرض لوحتك "${title}"`;
    const html = baseTemplate(
      `
      <h2 style="margin-top:0;color:#ad1457;">مرحباً ${escapeHtml(user.name)}</h2>
      <p style="color:#444;line-height:1.8;">تم إيقاف عرض لوحتك <strong>"${escapeHtml(title)}"</strong> بواسطة فريق المنصة.</p>
      ${reason ? `<div style="background:#fdecea;border:1px solid #f5c6cb;border-radius:8px;padding:14px;margin:16px 0;"><strong style="color:#c62828;">السبب:</strong> <span style="color:#842029;">${escapeHtml(reason)}</span></div>` : ""}
      <p style="color:#444;line-height:1.8;">إذا كنت ترى أن هذا القرار غير صحيح، تواصل مع فريق الدعم.</p>
    `,
      "#ad1457",
    );
    return this.sendEmail(user.email, subject, html);
  }

  // ═══════════════════════════════════════════════════
  //* Orders
  // ═══════════════════════════════════════════════════
  static async sendOrderShippedEmail(user, orderNumber, carrier) {
    const subject = `طلبك #${escapeHtml(orderNumber)} في الطريق إليك`;
    const html = baseTemplate(
      `
      <h2 style="margin-top:0;color:#5a6b7d;">خبر جميل يا ${escapeHtml(user.name)}!</h2>
      <p style="color:#444;line-height:1.8;">تم شحن طلبك <strong>#${escapeHtml(orderNumber)}</strong> عبر <strong>${escapeHtml(carrier)}</strong>.</p>
      <p style="color:#444;line-height:1.8;">ستصلك اللوحة خلال أيام العمل القادمة.</p>
      ${btn("http://localhost:5173/orders", "تتبع طلباتي")}
    `,
      "#5a6b7d",
    );
    return this.sendEmail(user.email, subject, html);
  }

  static async sendOrderDeliveredEmail(user, orderNumber) {
    const subject = `تم توصيل طلبك #${escapeHtml(orderNumber)}`;
    const html = baseTemplate(`
      <h2 style="margin-top:0;color:#2e7d32;">وصلت لوحتك يا ${escapeHtml(user.name)}! 🖼</h2>
      <p style="color:#444;line-height:1.8;">تم توصيل الطلب <strong>#${escapeHtml(orderNumber)}</strong> بنجاح.</p>
      <p style="color:#444;line-height:1.8;">نتمنى أن تنال إعجابك — ولا تنس مشاركتنا رأيك!</p>
    `);
    return this.sendEmail(user.email, subject, html);
  }

  static async sendFundsReleasedEmail(user, amount) {
    const subject = `تم إتاحة ${escapeHtml(amount)} ر.س في محفظتك`;
    const html = baseTemplate(`
      <h2 style="margin-top:0;color:#2e7d32;">أرباحك جاهزة يا ${escapeHtml(user.name)}!</h2>
      <p style="color:#444;line-height:1.8;">تم إطلاق مبلغ <strong>${escapeHtml(amount)} ر.س</strong> إلى رصيدك المتاح.</p>
      <p style="color:#444;line-height:1.8;">يمكنك الآن طلب سحبها إلى حسابك البنكي.</p>
      ${btn("http://localhost:5173/dashboard/wallet", "الذهاب للمحفظة")}
    `);
    return this.sendEmail(user.email, subject, html);
  }

  // ═══════════════════════════════════════════════════
  //* Withdrawals
  // ═══════════════════════════════════════════════════
  static async sendWithdrawalRequestedAdminEmail(admin, artistName, amount) {
    const subject = `طلب سحب جديد: ${escapeHtml(amount)} ر.س — ${escapeHtml(artistName)}`;
    const html = baseTemplate(
      `
      <h2 style="margin-top:0;color:#5a6b7d;">طلب سحب بانتظار المراجعة</h2>
      <p style="color:#444;line-height:1.8;">الفنان <strong>${escapeHtml(artistName)}</strong> طلب سحب <strong>${escapeHtml(amount)} ر.س</strong>.</p>
      ${btn("http://localhost:5173/admin/withdrawals", "مراجعة الطلب", "#5a6b7d")}
    `,
      "#5a6b7d",
    );
    return this.sendEmail(admin.email, subject, html);
  }

  // ═══════════════════════════════════════════════════
  //* Subscription
  // ═══════════════════════════════════════════════════
  static async sendSubscriptionExpiringEmail(user, daysLeft, planLabel) {
    const subject = `اشتراكك (${escapeHtml(planLabel)}) ينتهي خلال ${escapeHtml(daysLeft)} يوم`;
    const html = baseTemplate(
      `
      <h2 style="margin-top:0;color:#e65100;">لا تفقد مميزاتك يا ${escapeHtml(user.name)}!</h2>
      <p style="color:#444;line-height:1.8;">اشتراكك في باقة <strong>${escapeHtml(planLabel)}</strong> سينتهي خلال <strong>${escapeHtml(daysLeft)} يوم</strong>.</p>
      <p style="color:#444;line-height:1.8;">جدد الآن للحفاظ على ظهور لوحاتك في المعرض.</p>
      ${btn("http://localhost:5173/subscription", "تجديد الاشتراك", "#e65100")}
    `,
      "#e65100",
    );
    return this.sendEmail(user.email, subject, html);
  }

  static async sendSupportAdminEmail(admin, ticket) {
    const topics = {
      ORDER: "طلب",
      PAYMENT: "دفع",
      ARTWORK: "لوحة",
      ACCOUNT: "حساب",
      PARTNERSHIP: "شراكة",
      OTHER: "عام",
    };
    const subject = `رسالة دعم جديدة: ${escapeHtml(topics[ticket.topic] || ticket.topic)} — ${escapeHtml(ticket.name)}`;
    const html = baseTemplate(`
    <h2 style="margin-top:0;color:#2B2B2B;">رسالة دعم جديدة</h2>
    <p style="color:#444;line-height:1.8;"><strong>من:</strong> ${escapeHtml(ticket.name)} — ${escapeHtml(ticket.email)}</p>
    <p style="color:#444;line-height:1.8;"><strong>الموضوع:</strong> ${escapeHtml(topics[ticket.topic] || ticket.topic)}</p>
    <div style="background:#F6F3EF;border:1px solid #EAE4DC;border-radius:8px;padding:14px;margin:16px 0;color:#444;line-height:1.8;">${escapeHtml(ticket.message)}</div>
  `);
    return this.sendEmail(admin.email, subject, html);
  }

  // ═══════════════════════════════════════════════════
  //* Email Verification
  // ═══════════════════════════════════════════════════
  static async sendVerificationOTP(user, otp) {
    const subject = `رمز تأكيد بريدك الإلكتروني في فُنون`;
    const html = baseTemplate(`
      <h2 style="margin-top:0;color:#2B2B2B;">أهلاً ${escapeHtml(user.name)} 👋</h2>
      <p style="color:#444;line-height:1.8;">
        نحتاج نتأكد إن البريد ده تابع ليك. استخدم الرمز التالي لتأكيد حسابك:
      </p>
      <div style="background:#F6F3EF;border:2px solid #C5A880;border-radius:12px;padding:24px;margin:24px 0;text-align:center;">
        <p style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#5A1E2B;margin:0;font-family:monospace;">
          ${escapeHtml(otp)}
        </p>
      </div>
      <p style="color:#444;line-height:1.8;">
        الرمز صالح لمدة <strong>10 دقائق</strong>. لا تشاركه مع أي شخص.
      </p>
      <p style="color:#8A8580;font-size:12px;margin-top:24px;padding-top:16px;border-top:1px solid #EAE4DC;">
        إذا لم تطلب هذا الرمز، يمكنك تجاهل هذا البريد بأمان.
      </p>
    `);
    return this.sendEmail(user.email, subject, html);
  }
}

module.exports = EmailService;
