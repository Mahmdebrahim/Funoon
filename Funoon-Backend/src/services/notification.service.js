const Notification = require("../models/Notification");

class NotificationService {
  /**
   * Create notification for one user
   */
  static async create({ user, type, title, body, icon = "bell", data = {} }) {
    return Notification.create({ user, type, title, body, icon, data });
  }

  /**
   * Create notifications for multiple users (broadcast)
   */
  static async createForMany({
    users,
    type,
    title,
    body,
    icon = "bell",
    data = {},
  }) {
    const docs = users.map((user) => ({
      user: user._id || user,
      type,
      title,
      body,
      icon,
      data,
    }));
    return Notification.insertMany(docs, { ordered: false });
  }

  /**
   * Get user notifications with pagination
   */
  static async getUserNotifications(
    userId,
    { page = 1, limit = 20, unreadOnly = false } = {},
  ) {
    const filter = { user: userId };
    if (unreadOnly) filter.isRead = false;

    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments(filter),
      Notification.countDocuments({ user: userId, isRead: false }),
    ]);

    return {
      notifications,
      unreadCount,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
    };
  }

  /**
   * Mark one notification as read
   */
  static async markAsRead(notificationId, userId) {
    return Notification.findOneAndUpdate(
      { _id: notificationId, user: userId },
      { isRead: true },
      { new: true },
    );
  }

  /**
   * Mark all as read for a user
   */
  static async markAllAsRead(userId) {
    const result = await Notification.updateMany(
      { user: userId, isRead: false },
      { isRead: true },
    );
    return result.modifiedCount;
  }

  /**
   * Get unread count only (للـ badge في الـ navbar)
   */
  static async getUnreadCount(userId) {
    return Notification.countDocuments({ user: userId, isRead: false });
  }
}

module.exports = NotificationService;
