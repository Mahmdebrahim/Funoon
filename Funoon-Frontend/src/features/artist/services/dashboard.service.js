import api from "../../../services/api";

const unwrap = (response) => response?.data ?? response;

export const dashboardService = {
  // ─── Stats ───
  getStats: async () => {
    const response = await api.get("/artists/dashboard/stats");
    return unwrap(response);
  },

  // ─── Artist Orders ───
  getArtistOrders: async (params = {}) => {
    const response = await api.get("/artists/orders", { params });
    return unwrap(response);
  },

  // ─── My Artworks ───
  getMyArtworks: async (params = {}) => {
    const response = await api.get("/artworks/my", { params });
    return unwrap(response);
  },

  getArtwork: async (id) => {
    const response = await api.get(`/artworks/${id}`);
    return unwrap(response);
  },

  createArtwork: async (formData) => {
    const response = await api.post("/artworks", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return unwrap(response);
  },

  updateArtwork: async ({ id, formData }) => {
    const response = await api.put(`/artworks/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return unwrap(response);
  },

  deleteArtwork: async (id) => {
    const response = await api.delete(`/artworks/${id}`);
    return unwrap(response);
  },

  toggleArtworkActive: async (id) => {
    const response = await api.patch(`/artworks/${id}/toggle-active`);
    return unwrap(response);
  },

  getArtworksAnalytics: async (days = 30) => {
    const response = await api.get(`/artists/my/artworks-analytics?days=${days}`);
    return unwrap(response);
  },

  // ─── Subscription Payments ───
  getSubscriptionPayments: async () => {
    const response = await api.get("/subscriptions/my/payments");
    return unwrap(response);
  },

  // ─── Wallet ───
  getWallet: async () => {
    const response = await api.get("/wallet");
    return unwrap(response);
  },

  getWalletTransactions: async (params = {}) => {
    const response = await api.get("/wallet/transactions", { params });
    return unwrap(response);
  },

  // ─── Withdrawals ───
  requestWithdrawal: async (payload) => {
    const response = await api.post("/withdrawals", payload);
    return unwrap(response);
  },

  getMyWithdrawals: async () => {
    const response = await api.get("/withdrawals/my");
    return unwrap(response);
  },

  // ─── Shipping ───
  calculateShipping: async (payload) => {
    const response = await api.post("/shipping/calculate", payload);
    return unwrap(response);
  },

  createShipment: async (payload) => {
    const response = await api.post("/shipping/create", payload);
    return unwrap(response);
  },

  getAWB: async (orderId) => {
    const response = await api.get(`/shipping/${orderId}/awb`);
    return unwrap(response);
  },

  trackShipment: async (orderId) => {
    const response = await api.get(`/shipping/${orderId}/track`);
    return unwrap(response);
  },

  getMySales: async (params = {}) => {
    const response = await api.get("/orders/my-sales", { params });
    return unwrap(response);
  },
};
