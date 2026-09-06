// src/services/api.js
import axios from "axios";
import { useAuthStore } from "../features/auth/stores/authStore";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1",
  timeout: 15000,
  withCredentials: true,
});

// Request interceptor
api.interceptors.request.use((config) => {
  const token =
    useAuthStore.getState().accessToken || localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  failedQueue = [];
};

// ✅ قائمة الـ endpoints اللي مش هنعملها refresh
const AUTH_ENDPOINTS = [
  "/auth/login",
  "/auth/register",
  "/auth/refresh-token",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/verify-email",
  "/auth/resend-otp",
  "/auth/verify-status",
];

const isAuthEndpoint = (url) => {
  return AUTH_ENDPOINTS.some((endpoint) => url?.includes(endpoint));
};

api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;

    // ✅ لو الـ error من auth endpoint، ارجع الـ error مباشرة بدون refresh
    if (isAuthEndpoint(originalRequest?.url)) {
      return Promise.reject(error.response?.data || error);
    }

    // ✅ بس اعمل refresh للـ 401 من الـ endpoints التانية
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshResponse = await api.post("/auth/refresh-token");
        const accessToken = refreshResponse?.data?.accessToken;

        if (!accessToken) {
          throw new Error("Refresh token response missing access token");
        }

        useAuthStore.getState().setToken(accessToken);
        processQueue(null, accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        useAuthStore.getState().logout();

        const protectedPaths = [
          "/dashboard",
          "/admin",
          "/profile",
          "/checkout",
          "/wallet",
          "/subscription",
          "/orders",
          "/artist",
        ];
        const currentPath = window.location.pathname;
        const isProtected = protectedPaths.some((path) =>
          currentPath.startsWith(path),
        );
        if (isProtected) {
          window.location.href = "/login";
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error.response?.data || error);
  },
);

export default api;
