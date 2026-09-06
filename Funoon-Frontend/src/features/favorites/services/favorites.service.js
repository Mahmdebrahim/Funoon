import api from "../../../services/api";

const unwrap = (response) => response?.data ?? response;

export const favoritesService = {
  toggle: async (artworkId) => {
    const response = await api.post("/favorites/toggle", { artworkId });
    return unwrap(response);
  },

  getMyFavorites: async (params = {}) => {
    const response = await api.get("/favorites", { params });
    return unwrap(response);
  },

  check: async (artworkId) => {
    const response = await api.get(`/favorites/${artworkId}/status`);
    return unwrap(response)?.isFavorite ?? false;
  },
};
