import api from "../../../services/api";

const unwrap = (response) => response?.data ?? response;

export const profileService = {
  getProfile: async () => {
    const response = await api.get("/users/profile");
    return unwrap(response);
  },

  updateProfile: async (payload) => {
    const response = await api.put("/users/profile", payload);
    return unwrap(response);
  },

  uploadAvatar: async (file) => {
    const formData = new FormData();
    formData.append("avatar", file);
    const response = await api.post("/users/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return unwrap(response);
  },

  changePassword: async ({ currentPassword, newPassword }) => {
    const response = await api.post("/users/change-password", {
      currentPassword,
      newPassword,
    });
    return response;
  },

  getAddress: async () => {
    const response = await api.get("/users/address");
    return unwrap(response);
  },

  updateAddress: async (payload) => {
    const response = await api.put("/users/address", payload);
    return unwrap(response);
  },

  lookupAddress: async (shortAddressCode) => {
    const response = await api.post("/users/address/lookup", {
      shortAddressCode,
    });
    return unwrap(response);
  },
  
  getBankAccount: async () => {
    try {
      const response = await api.get("/bank-account");
      return unwrap(response);
    } catch (error) {
      if (error?.message?.toLowerCase().includes("no bank account")) {
        return null;
      }
      throw error;
    }
  },

  setBankAccount: async (payload) => {
    const response = await api.post("/bank-account", payload);
    return unwrap(response);
  },

  deleteAccount: async (password) => {
    const response = await api.delete("/users/account", { data: { password } });
    return response;
  },
};
