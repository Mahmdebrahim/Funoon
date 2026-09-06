import api from "../../../services/api";

const unwrap = (response) => response?.data ?? response;

export const cartService = {
  getCart: async () => {
    const response = await api.get("/cart");
    return unwrap(response);
  },

  addItem: async (artworkId) => {
    const response = await api.post("/cart/items", { artworkId });
    return unwrap(response);
  },

  removeItem: async (artworkId) => {
    const response = await api.delete(`/cart/items/${artworkId}`);
    return unwrap(response);
  },

  clearCart: async () => {
    const response = await api.delete("/cart");
    return unwrap(response);
  },
};
