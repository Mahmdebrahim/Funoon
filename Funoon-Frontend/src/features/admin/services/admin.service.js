import api from "../../../services/api";

const unwrap = (response) => response?.data ?? response;

export const adminService = {
  getStats: async (period = "30d") => {
    const response = await api.get("/admin/stats", { params: { period } });
    return unwrap(response);
  },

  getFinancialStats: async () => {
    const response = await api.get("/admin/stats/financial");
    return unwrap(response);
  },

  getOrders: async (params = {}) => {
    const response = await api.get("/admin/orders", { params });
    return unwrap(response);
  },
  holdOrder: async (orderId, reason) => {
    const response = await api.patch(`/admin/orders/${orderId}/hold`, {
      reason,
    });
    return unwrap(response);
  },
  unholdOrder: async (orderId) => {
    const response = await api.patch(`/admin/orders/${orderId}/unhold`);
    return unwrap(response);
  },
  releaseOrder: async (orderId) => {
    const response = await api.patch(`/admin/orders/${orderId}/release`);
    return unwrap(response);
  },

  getWithdrawals: async (params = {}) => {
    const response = await api.get("/admin/withdrawals", { params });
    return unwrap(response);
  },
  getWithdrawalsSummary: async () => {
    const response = await api.get("/admin/withdrawals/summary");
    return unwrap(response);
  },
  approveWithdrawal: async (id) => {
    const response = await api.put(`/admin/withdrawals/${id}/approve`);
    return unwrap(response);
  },
  markWithdrawalPaid: async (id, transferReference) => {
    const response = await api.put(`/admin/withdrawals/${id}/mark-paid`, {
      transferReference,
    });
    return unwrap(response);
  },
  rejectWithdrawal: async (id, reason) => {
    const response = await api.put(`/admin/withdrawals/${id}/reject`, {
      reason,
    });
    return unwrap(response);
  },

  getAdminArtists: async (params = {}) => {
    const response = await api.get("/admin/artists", { params });
    return unwrap(response);
  },
  getPendingBankAccounts: async () => {
    const response = await api.get("/admin/bank-accounts/pending");
    return unwrap(response);
  },
  verifyBankAccount: async (id) => {
    const response = await api.patch(`/admin/bank-accounts/${id}/verify`);
    return unwrap(response);
  },
  rejectBankAccount: async (id, reason) => {
    const response = await api.patch(`/admin/bank-accounts/${id}/reject`, {
      reason,
    });
    return unwrap(response);
  },

  getAdminUsers: async (params = {}) => {
    const response = await api.get("/admin/users", { params });
    return unwrap(response);
  },
  banUser: async (id, reason) => {
    const response = await api.patch(`/admin/users/${id}/ban`, { reason });
    return unwrap(response);
  },
  unbanUser: async (id) => {
    const response = await api.patch(`/admin/users/${id}/unban`);
    return unwrap(response);
  },

  getAuditLogs: async (params = {}) => {
    const response = await api.get("/admin/audit-logs", { params });
    return unwrap(response);
  },

  // ═══ Artworks Management ═══
  getAdminArtworks: async (params = {}) => {
    const response = await api.get("/admin/artworks", { params });
    return unwrap(response);
  },
  getPendingArtworks: async (params = {}) => {
    const response = await api.get("/admin/artworks/pending", { params });
    return unwrap(response);
  },
  approveArtwork: async (id) => {
    const response = await api.patch(`/admin/artworks/${id}/approve`);
    return unwrap(response);
  },
  rejectArtwork: async (id, reason) => {
    const response = await api.patch(`/admin/artworks/${id}/reject`, {
      reason,
    });
    return unwrap(response);
  },
  suspendArtwork: async (id, reason) => {
    const response = await api.patch(`/admin/artworks/${id}/suspend`, {
      reason,
    });
    return unwrap(response);
  },
  unsuspendArtwork: async (id) => {
    const response = await api.patch(`/admin/artworks/${id}/unsuspend`);
    return unwrap(response);
  },
  deleteArtwork: async (id) => {
    const response = await api.delete(`/admin/artworks/${id}`);
    return unwrap(response);
  },
};
