const NotificationService = require("../services/notification.service");
const ApiResponse = require("../utils/api-response");
const catchAsync = require("../utils/catch-async");

// @desc    Get current user notifications
// @route   GET /api/v1/notifications?unreadOnly=true&page=1
const getMyNotifications = catchAsync(async (req, res) => {
  const { page = 1, limit = 20, unreadOnly } = req.query;

  const result = await NotificationService.getUserNotifications(req.user._id, {
    page: Number(page),
    limit: Number(limit),
    unreadOnly: unreadOnly === "true",
  });

  return ApiResponse.success(res, result, "Notifications retrieved");
});

// @desc    Get unread count only
// @route   GET /api/v1/notifications/unread-count
const getUnreadCount = catchAsync(async (req, res) => {
  const count = await NotificationService.getUnreadCount(req.user._id);
  return ApiResponse.success(res, { unreadCount: count }, "Unread count");
});

// @desc    Mark one notification as read
// @route   PATCH /api/v1/notifications/:id/read
const markAsRead = catchAsync(async (req, res) => {
  const notification = await NotificationService.markAsRead(
    req.params.id,
    req.user._id,
  );
  if (!notification) {
    return ApiResponse.success(res, null, "Notification not found");
  }
  return ApiResponse.success(res, notification, "Marked as read");
});

// @desc    Mark all as read
// @route   POST /api/v1/notifications/mark-all-read
const markAllAsRead = catchAsync(async (req, res) => {
  const count = await NotificationService.markAllAsRead(req.user._id);
  return ApiResponse.success(
    res,
    { markedCount: count },
    `Marked ${count} notifications as read`,
  );
});

module.exports = {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
};
