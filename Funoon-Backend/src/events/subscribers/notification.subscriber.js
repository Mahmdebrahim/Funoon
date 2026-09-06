const eventEmitter = require("../event-emitter");
const EVENTS = require("../events");
const NotificationService = require("../../services/notification.service");
const User = require("../../models/User");
const logger = require("../../utils/logger");

// ═══ الأحداث اللي بتروح للأدمنز (broadcast) ═══
const ADMIN_EVENTS = [
  EVENTS.ARTWORK_SUBMITTED,
  EVENTS.ARTWORK_UPDATED_NEEDS_REVIEW,
  EVENTS.WITHDRAWAL_REQUESTED,
  EVENTS.SUPPORT_MESSAGE_RECEIVED,
];

/**
 * إشعارات المستخدم العادي (فنان / مشترى)
 */
const buildNotification = (event, payload) => {
  switch (event) {
    case EVENTS.ARTWORK_APPROVED:
      return {
        user: payload.artistId,
        type: "ARTWORK_APPROVED",
        title: "تم اعتماد لوحتك",
        body: `تم اعتماد "${payload.title}" وهي الآن ظاهرة في المعرض`,
        icon: "CheckCircle2",
        data: { route: "/dashboard/artworks", artworkId: payload.artworkId },
      };

    case EVENTS.ARTWORK_REJECTED:
      return {
        user: payload.artistId,
        type: "ARTWORK_REJECTED",
        title: "تم رفض لوحتك",
        body: `تم رفض "${payload.title}". ${payload.reason ? `السبب: ${payload.reason}` : ""}`,
        icon: "XCircle",
        data: { route: "/dashboard/artworks", artworkId: payload.artworkId },
      };

    case EVENTS.ARTWORK_SUSPENDED:
      return {
        user: payload.artistId,
        type: "ARTWORK_SUSPENDED",
        title: "تم إيقاف لوحتك",
        body: `تم إيقاف "${payload.title}" بواسطة فريق المنصة. ${payload.reason || ""}`,
        icon: "ShieldAlert",
        data: { route: "/dashboard/artworks", artworkId: payload.artworkId },
      };

    case EVENTS.ORDER_PAID:
      return {
        user: payload.artistId,
        type: "ORDER_PAID",
        title: "تم الدفع — طلب جديد",
        body: `طلب بمبلغ ${payload.totalAmount} ر.س — ابدأ التجهيز للشحن`,
        icon: "DollarSign",
        data: { route: "/dashboard/orders", orderId: payload.orderId },
      };

    case EVENTS.ORDER_SHIPPED:
      return {
        user: payload.buyerId,
        type: "ORDER_SHIPPED",
        title: "طلبك في الطريق",
        body: `تم شحن طلبك عبر ${payload.carrier}`,
        icon: "Truck",
        data: { route: "/orders", orderId: payload.orderId },
      };

    case EVENTS.ORDER_DELIVERED:
      return {
        user: payload.buyerId,
        type: "ORDER_DELIVERED",
        title: "تم توصيل طلبك",
        body: "تم التوصيل بنجاح — استمتع بلوحتك الجديدة!",
        icon: "CheckCircle2",
        data: { route: "/orders", orderId: payload.orderId },
      };

    case EVENTS.ORDER_FUNDS_RELEASED:
      return {
        user: payload.artistId,
        type: "ORDER_FUNDS_RELEASED",
        title: "أموالك جاهزة",
        body: `تم إطلاق ${payload.amount} ر.س إلى محفظتك`,
        icon: "Wallet",
        data: { route: "/dashboard/wallet" },
      };

    case EVENTS.WITHDRAWAL_APPROVED:
      return {
        user: payload.userId,
        type: "WITHDRAWAL_APPROVED",
        title: "تمت الموافقة على سحبك",
        body: `تمت الموافقة على سحب ${payload.amount} ر.س`,
        icon: "CheckCircle2",
        data: { route: "/dashboard/wallet" },
      };

    case EVENTS.WITHDRAWAL_REJECTED:
      return {
        user: payload.userId,
        type: "WITHDRAWAL_REJECTED",
        title: "تم رفض طلب السحب",
        body: `تم رفض سحب ${payload.amount} ر.س. ${payload.reason || ""}`,
        icon: "XCircle",
        data: { route: "/dashboard/wallet" },
      };

    case EVENTS.WITHDRAWAL_PAID:
      return {
        user: payload.userId,
        type: "WITHDRAWAL_PAID",
        title: "تم التحويل البنكي",
        body: `تم تحويل ${payload.amount} ر.س لحسابك`,
        icon: "Landmark",
        data: { route: "/dashboard/wallet" },
      };

    case EVENTS.SUBSCRIPTION_EXPIRING:
      return {
        user: payload.userId,
        type: "SUBSCRIPTION_EXPIRING",
        title: "اشتراكك ينتهي قريباً",
        body: `اشتراكك ينتهي خلال ${payload.daysLeft} أيام — جدد الآن`,
        icon: "Clock",
        data: { route: "/subscription" },
      };

    default:
      return null;
  }
};

/**
 * إشعارات الأدمن (بتتبعت لكل الأدمنز)
 */
const buildAdminNotification = (event, payload) => {
  switch (event) {
    case EVENTS.ARTWORK_SUBMITTED:
      return {
        type: "ARTWORK_SUBMITTED",
        title: "لوحة جديدة بانتظار المراجعة",
        body: `${payload.artistName} رفع لوحة "${payload.title}"`,
        icon: "Clock",
        data: { route: "/admin/artworks" },
      };

    case EVENTS.ARTWORK_UPDATED_NEEDS_REVIEW:
      return {
        type: "ARTWORK_UPDATED_NEEDS_REVIEW",
        title: "تعديل على لوحة يتطلب مراجعة",
        body: `${payload.artistName} عدّل على "${payload.artworkTitle}"`,
        icon: "RefreshCw",
        data: { route: "/admin/artworks" },
      };

    case EVENTS.WITHDRAWAL_REQUESTED:
      return {
        type: "WITHDRAWAL_REQUESTED",
        title: "طلب سحب جديد",
        body: `${payload.userName} طلب سحب ${payload.amount} ر.س`,
        icon: "Landmark",
        data: { route: "/admin/withdrawals" },
      };
      
    case EVENTS.SUPPORT_MESSAGE_RECEIVED:
      return {
        type: "SUPPORT_MESSAGE_RECEIVED",
        title: "رسالة دعم جديدة",
        body: `${payload.name} (${payload.email}): ${payload.topic}`,
        icon: "Headphones",
        data: { route: "/admin/support" },
      };

    default:
      return null;
  }
};

// ═══ التسجيل ═══
Object.values(EVENTS).forEach((event) => {
  eventEmitter.on(event, async (payload) => {
    try {
      // ─── إشعارات الأدمن (broadcast لكل الأدمنز) ───
      if (ADMIN_EVENTS.includes(event)) {
        const admins = await User.find({ role: "admin" }).select("_id");
        if (!admins.length) return;

        const notif = buildAdminNotification(event, payload);
        if (!notif) return;

        await NotificationService.createForMany({
          users: admins,
          ...notif,
        });
        logger.debug(`[NotificationSubscriber] Admin broadcast for ${event}`);
        return;
      }

      // ─── إشعارات المستخدمين العاديين ───
      const notification = buildNotification(event, payload);
      if (!notification) return;

      await NotificationService.create(notification);
      logger.debug(`[NotificationSubscriber] Created for ${event}`);
    } catch (error) {
      logger.error(`[NotificationSubscriber] Failed for ${event}:`, error);
    }
  });
});

logger.info("✅ Notification subscriber registered (users + admins)");
