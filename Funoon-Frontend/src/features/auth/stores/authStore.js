import { create } from "zustand";
import { persist } from "zustand/middleware";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

// Access Token: 7 أيام (كافي وآمن)
// Refresh Token: 90 يوم (في الـ backend)
 let _refreshPromise = null

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false, // ← false دايماً، persist بيحمل فوراً

      login: (user, token) => {
        localStorage.setItem("accessToken", token);
        set({ user, accessToken: token, isAuthenticated: true });
      },

      logout: async () => {
        const token = get().accessToken;
        try {
          await axios.post(
            `${API_URL}/auth/logout`,
            {},
            {
              withCredentials: true,
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            },
          );
        } catch {
        } finally {
          localStorage.removeItem("accessToken");
          set({ user: null, accessToken: null, isAuthenticated: false });
        }
      },

      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),

      setToken: (token) => {
        localStorage.setItem("accessToken", token);
        set({ accessToken: token, isAuthenticated: true });
      },

      // بيشتغل في الخلفية بدون أي UI blocking
      initializeAuth: async () => {
        const token = get().accessToken || localStorage.getItem("accessToken");

        if (!token) {
          // جرب الـ refresh cookie صامت
          try {
            await get()._refreshSilently();
          } catch {
            set({ user: null, accessToken: null, isAuthenticated: false });
          }
          return;
        }

        // تحقق من الـ token في الخلفية صامت
        try {
          const user = await get()._fetchUser(token);
          set({ user, isAuthenticated: true }); // بس حدّث الـ user
        } catch {
          // Token انتهى، جرب refresh
          try {
            await get()._refreshSilently();
          } catch {
            // كل حاجة فشلت → logout صامت
            localStorage.removeItem("accessToken");
            set({ user: null, accessToken: null, isAuthenticated: false });
          }
        }
      },

      // Private helpers
      _fetchUser: async (token) => {
        const res = await axios.get(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });
        return res.data?.data;
      },

      _refreshSilently: async () => {
        if (_refreshPromise) return _refreshPromise;

        _refreshPromise = axios
          .post(`${API_URL}/auth/refresh-token`, {}, { withCredentials: true })
          .then(async (res) => {
            const newToken = res.data?.data?.accessToken;
            if (!newToken) throw new Error("No token");
            const user = await get()._fetchUser(newToken);
            localStorage.setItem("accessToken", newToken);
            set({ user, accessToken: newToken, isAuthenticated: true });
          })
          .catch((err) => {
            // ← أضيف ده
            // الـ refresh فشل → امسح كل حاجة نهائياً
            localStorage.removeItem("accessToken");
            set({ user: null, accessToken: null, isAuthenticated: false });
            throw err;
          })
          .finally(() => {
            _refreshPromise = null;
          });

        return _refreshPromise;
      },
    }),
    {
      name: "funoon-auth",
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
