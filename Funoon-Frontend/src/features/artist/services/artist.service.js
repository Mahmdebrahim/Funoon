import api from "../../../services/api";

const unwrap = (response) => response?.data ?? response;

export const artistService = {
  getAllArtists: async (params = {}) => {
    const response = await api.get("/artists", { params });
    return unwrap(response);
  },

  getArtistProfile: async (artistId) => {
    const response = await api.get(`/artists/${artistId}`);
    return unwrap(response);
  },

};
