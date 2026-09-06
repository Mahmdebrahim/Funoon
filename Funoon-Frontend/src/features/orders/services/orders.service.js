import api from "../../../services/api";

export const ordersService = {
  getMyOrders: async (params = {}) => {
    try {
      const { data } = await api.get("/orders/my-orders", { params });

      console.log("📥 Orders response:", data);

      // Handle different response structures
      if (data?.data?.orders) {
        return data.data;
      } else if (data?.orders) {
        return data;
      } else if (Array.isArray(data?.data)) {
        return { orders: data.data, pagination: { total: data.data.length } };
      } else {
        console.warn("⚠️ Unexpected orders response structure:", data);
        return { orders: [], pagination: { total: 0 } };
      }
    } catch (error) {
      console.error("❌ Error fetching orders:", error);
      // Return empty structure instead of throwing
      return { orders: [], pagination: { total: 0 } };
    }
  },

  getOrderById: async (orderId) => {
    try {
      const { data } = await api.get(`/orders/${orderId}`);
      return data?.data || data;
    } catch (error) {
      console.error("❌ Error fetching order:", error);
      throw error;
    }
  },

  checkout: async (paymentMethod = "creditcard") => {
    try {
      const { data } = await api.post("/orders/checkout", { paymentMethod });
      return data?.data || data;
    } catch (error) {
      console.error("❌ Error performing checkout:", error);
      throw error;
    }
  },

  cancelOrder: async (orderId, reason) => {
    const { data } = await api.patch(`/orders/${orderId}/cancel`, { reason });
    return data.data;
  },

  confirmDelivery: async (orderId) => {
    const response = await api.patch(`/orders/${orderId}/confirm-delivery`);
    return response?.data?.data ?? response?.data ?? response;
  },

  // verifyPayment: async (paymentId) => {
  //   try {
  //     const { data } = await api.post("/orders/verify-payment", { paymentId });
  //     return data?.data || data;
  //   } catch (error) {
  //     console.error("❌ Error verifying payment:", error);
  //     throw error;
  //   }
  // },
};
