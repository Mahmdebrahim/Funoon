// src/services/auth.service.js
import api from "./api";

const authService = {
  /**
   * Verify email using OTP
   * @param {string} userId
   * @param {string} otp - 6-digit numeric code
   */
  verifyEmail: (userId, otp) =>
    api.post("/auth/verify-email", { userId, otp }),

  /**
   * Resend OTP to user email
   * @param {string} userId
   */
  resendOtp: (userId) => api.post("/auth/resend-otp", { userId }),

  /**
   * Check email verification status
   * @param {string} userId
   */
  checkVerificationStatus: (userId) =>
    api.get(`/auth/verify-status/${userId}`),
};

export default authService;
