import api from "./api";

const unwrap = (response) => response?.data ?? response;

export const notificationService = {
  getMyNotifications: async (params = {}) => {
    const response = await api.get("/notifications", { params });
    return unwrap(response);
  },

  getUnreadCount: async () => {
    const response = await api.get("/notifications/unread-count");
    return unwrap(response);
  },

  markAsRead: async (id) => {
    const response = await api.patch(`/notifications/${id}/read`);
    return unwrap(response);
  },

  markAllAsRead: async () => {
    const response = await api.post("/notifications/mark-all-read");
    return unwrap(response);
  },
};
