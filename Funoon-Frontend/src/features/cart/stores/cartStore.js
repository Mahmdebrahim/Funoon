import { create } from "zustand";
import { cartService } from "../services/cart.service";

export const useCartStore = create((set, get) => ({
  items: [],
  summary: { subtotal: 0, totalShipping: 0, total: 0 },
  isLoading: false,
  isInCartMap: {},
  _syncing: false, // ✅ guard لمنع أكتر من polling في نفس الوقت

  fetchCart: async () => {
    set({ isLoading: true });
    try {
      const cart = await cartService.getCart();
      const isInCartMap = {};
      cart.items?.forEach((item) => {
        const id = item.artwork?._id ?? item.artwork;
        if (id) isInCartMap[String(id)] = true;
      });
      set({
        items: cart.items || [],
        summary: cart.summary || { subtotal: 0, totalShipping: 0, total: 0 },
        isInCartMap,
        isLoading: false,
      });
    } catch (error) {
      console.error("Failed to fetch cart:", error);
      set({ isLoading: false });
    }
  },

  isInCart: (artworkId) => !!get().isInCartMap[String(artworkId)],

  resetCart: () =>
    set({
      items: [],
      summary: { subtotal: 0, totalShipping: 0, total: 0 },
      isInCartMap: {},
      isLoading: false,
    }),

  // ✅ جديد: يستنى الـ webhook يفضي السلة في الـ backend، بعدين يحدث الـ UI
  // شغال في الـ store level → بيكمل حتى لو الـ user ساب صفحة الـ success
  syncAfterPayment: async () => {
    if (get()._syncing) return; // منع تزامن أكتر من polling
    set({ _syncing: true });
    try {
      // استنى لحظة عشان الـ webhook ياخد وقته يفضي السلة
      await new Promise((resolve) => setTimeout(resolve, 1000));

      let attempts = 0;
      const maxAttempts = 8; // ~12 ثانية كحد أقصى

      while (attempts < maxAttempts) {
        await get().fetchCart();
        if (get().items.length === 0) break; // ✅ السلة فضيت في الـ backend
        attempts += 1;
        if (attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 1500));
        }
      }
    } catch (error) {
      console.error("syncAfterPayment error:", error);
    } finally {
      set({ _syncing: false });
    }
  },

  addItem: async (artworkId) => {
    const id = String(artworkId);
    set((state) => ({
      isInCartMap: { ...state.isInCartMap, [id]: true },
    }));
    try {
      await cartService.addItem(id);
      await get().fetchCart();
      return true;
    } catch (error) {
      set((state) => {
        const nextMap = { ...state.isInCartMap };
        delete nextMap[id];
        return { isInCartMap: nextMap };
      });
      throw error;
    }
  },

  removeItem: async (artworkId) => {
    const id = String(artworkId);
    const previousMap = get().isInCartMap;
    set((state) => {
      const nextMap = { ...state.isInCartMap };
      delete nextMap[id];
      return { isInCartMap: nextMap };
    });
    try {
      await cartService.removeItem(id);
      await get().fetchCart();
      return true;
    } catch (error) {
      set({ isInCartMap: previousMap });
      throw error;
    }
  },

  clearCart: async () => {
    try {
      await cartService.clearCart();
      set({
        items: [],
        summary: { subtotal: 0, totalShipping: 0, total: 0 },
        isInCartMap: {},
      });
      return true;
    } catch (error) {
      throw error;
    }
  },
}));
