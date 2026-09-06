import api from "../../../services/api";

const unwrap = (response) => response?.data ?? response;

export const reviewService = {
  // Create a new review for a completed order
  createReview: async ({ orderId, rating, comment }) => {
    const response = await api.post("/reviews", { orderId, rating, comment });
    return unwrap(response);
  },

  // Get artist reviews + summary (public)
  getArtistReviews: async (artistId, params = {}) => {
    const response = await api.get(`/artists/${artistId}/reviews`, { params });
    return unwrap(response);
  },

  // Get buyer's reviews
  getMyReviews: async (params = {}) => {
    const response = await api.get("/reviews/my", { params });
    return unwrap(response);
  },

  // Update a review (within 7 days)
  updateReview: async (reviewId, { rating, comment }) => {
    const response = await api.put(`/reviews/${reviewId}`, { rating, comment });
    return unwrap(response);
  },

  // Get recent top reviews for home page
  getRecentReviews: async (params = {}) => {
    const response = await api.get("/reviews/recent", { params });
    return unwrap(response);
  },

  // Hide a review (Admin only)
  hideReview: async (reviewId, { reason }) => {
    const response = await api.patch(`/reviews/${reviewId}/hide`, { reason });
    return unwrap(response);
  },
};
