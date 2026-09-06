// src/features/auth/stores/authStore.js
import { create } from "zustand";
import { persist } from "zustand/middleware";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

let _refreshPromise = null;

export let sharedQueryClient = null;
export function setSharedQueryClient(client) {
  sharedQueryClient = client;
}

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,

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
          // ignore logout API errors
        } finally {
          localStorage.removeItem("accessToken");
          set({ user: null, accessToken: null, isAuthenticated: false });
          if (sharedQueryClient) {
            sharedQueryClient.clear();
          }
        }
      },

      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),

      refreshUser: async () => {
        const token = get().accessToken || localStorage.getItem("accessToken");
        if (!token) return null;
        try {
          const user = await get()._fetchUser(token);
          set({ user, isAuthenticated: true });
          return user;
        } catch {
          try {
            await get()._refreshSilently();
            return get().user;
          } catch {
            return null;
          }
        }
      },

      setToken: (token) => {
        localStorage.setItem("accessToken", token);
        set({ accessToken: token, isAuthenticated: true });
      },

      initializeAuth: async () => {
        const token = get().accessToken || localStorage.getItem("accessToken");

        if (!token) {
          try {
            await get()._refreshSilently();
          } catch {
            set({ user: null, accessToken: null, isAuthenticated: false });
          }
          return;
        }

        try {
          const user = await get()._fetchUser(token);
          set({ user, isAuthenticated: true });
        } catch {
          try {
            await get()._refreshSilently();
          } catch {
            localStorage.removeItem("accessToken");
            set({ user: null, accessToken: null, isAuthenticated: false });
          }
        }
      },

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
