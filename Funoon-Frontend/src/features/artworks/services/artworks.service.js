// src/features/artworks/services/artworks.service.js
import api from "../../../services/api";

export const artworksService = {
  /**
   * Get artworks with filters, pagination, sorting
   */
  getArtworks: async (filters = {}) => {
    const cleanFilters = Object.fromEntries(
      Object.entries(filters).filter(([_, value]) => {
        if (value === null || value === undefined || value === "") return false;
        if (Array.isArray(value) && value.length === 0) return false;
        return true;
      }),
    );
    const { data } = await api.get("/artworks", { params: cleanFilters });
    if (data?.data) return data.data;
    if (data?.artworks) return data;
    return {
      artworks: [],
      pagination: {
        total: 0,
        page: 1,
        pages: 0,
        limit: 12,
        hasNext: false,
        hasPrev: false,
      },
    };
  },

  /**
   * Get filter options (categories, mediums, cities, price ranges)
   */
  getFilterOptions: async () => {
    try {
      const { data } = await api.get("/artworks/filters");
      if (data?.data) return data.data;
      if (data?.categories) return data;
      return {
        categories: [],
        mediums: [],
        cities: [],
        priceRange: { min: 0, max: 10000 },
        sizeDistribution: { small: 0, medium: 0, large: 0, giant: 0 },
        totalCount: 0,
      };
    } catch {
      return {
        categories: [],
        mediums: [],
        cities: [],
        priceRange: { min: 0, max: 10000 },
        sizeDistribution: { small: 0, medium: 0, large: 0, giant: 0 },
        totalCount: 0,
      };
    }
  },

  /**
   * Get single artwork details
   */
  getArtworkById: async (id) => {
    const { data } = await api.get(`/artworks/${id}`);
    if (data?.data) return data;
    if (data?.artwork) return data;
    return data;
  },

  // ─── Featured ─────────────────────────────────────────────────────────────

  /** Get featured artworks (public) */
  getFeatured: async ({ limit = 10, page = 1 } = {}) => {
    const { data } = await api.get("/artworks/featured", {
      params: { limit, page },
    });
    return data?.data || data;
  },

  /** Feature an artwork (artist prestige only) */
  featureArtwork: async (id) => {
    const { data } = await api.patch(`/artworks/${id}/feature`);
    return data?.data || data;
  },

  /** Unfeature an artwork (artist owner or admin) */
  unfeatureArtwork: async (id) => {
    const { data } = await api.patch(`/artworks/${id}/unfeature`);
    return data?.data || data;
  },

  // ─── Platform Stats ────────────────────────────────────────────────────────

  /** Get platform statistics */
  getPlatformStats: async () => {
    const { data } = await api.get("/artworks/stats");
    return data?.data || data;
  },
};
