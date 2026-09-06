import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { dashboardService } from "../services/dashboard.service";
import { artworksService } from "../../artworks/services/artworks.service";

// ═══════════════════════════════════════════════════
// Queries
// ═══════════════════════════════════════════════════

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboardStats"],
    queryFn: dashboardService.getStats,
    staleTime: 30 * 1000,
  });
}

export function useArtistOrders(filters = {}) {
  return useQuery({
    queryKey: ["artistOrders", filters],
    queryFn: () => dashboardService.getArtistOrders(filters),
    staleTime: 15 * 1000,
  });
}

export function useMyArtworks(filters = {}) {
  return useQuery({
    queryKey: ["myArtworks", filters],
    queryFn: () => dashboardService.getMyArtworks(filters),
    staleTime: 30 * 1000,
  });
}

export function useWallet() {
  return useQuery({
    queryKey: ["wallet"],
    queryFn: dashboardService.getWallet,
    staleTime: 30 * 1000,
  });
}

export function useWalletTransactions(filters = {}) {
  return useQuery({
    queryKey: ["walletTransactions", filters],
    queryFn: () => dashboardService.getWalletTransactions(filters),
    staleTime: 15 * 1000,
  });
}

export function useMyWithdrawals() {
  return useQuery({
    queryKey: ["myWithdrawals"],
    queryFn: dashboardService.getMyWithdrawals,
    staleTime: 30 * 1000,
  });
}

export function useSubscriptionPayments() {
  return useQuery({
    queryKey: ["subscriptionPayments"],
    queryFn: dashboardService.getSubscriptionPayments,
    retry: false,
  });
}


export const useArtistAnalytics = (days = 30) => {
  return useQuery({
    queryKey: ["artistAnalytics", days],
    queryFn: () => dashboardService.getArtworksAnalytics(days),
    staleTime: 5 * 60 * 1000,
  });
};

// ═══════════════════════════════════════════════════
// Mutations — Artworks
// ═══════════════════════════════════════════════════

export function useArtwork(id) {
  return useQuery({
    queryKey: ["artwork", id],
    queryFn: () => dashboardService.getArtwork(id),
    enabled: !!id,
    staleTime: 0,
  });
}

export function useCreateArtwork() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: dashboardService.createArtwork,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myArtworks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
      toast.success("تم إضافة اللوحة بنجاح 🎨");
    },
    onError: (error) => {
      toast.error(error?.message || "فشل إضافة اللوحة");
    },
  });
}

export function useUpdateArtwork() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: dashboardService.updateArtwork,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["myArtworks"] });
      queryClient.invalidateQueries({ queryKey: ["artwork", variables.id] }); // ✅ جديد
      toast.success("تم تحديث اللوحة بنجاح");
    },
    onError: (error) => {
      toast.error(error?.message || "فشل تحديث اللوحة");
    },
  });
}

export function useDeleteArtwork() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: dashboardService.deleteArtwork,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myArtworks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
      toast.success("تم حذف اللوحة");
    },
    onError: (error) => {
      toast.error(error?.message || "فشل حذف اللوحة");
    },
  });
}

export function useToggleArtworkActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: dashboardService.toggleArtworkActive,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myArtworks"] });
      toast.success("تم تحديث حالة اللوحة");
    },
    onError: (error) => {
      toast.error(error?.message || "فشل تحديث الحالة");
    },
  });
}

// ═══════════════════════════════════════════════════
// Mutations — Withdrawals
// ═══════════════════════════════════════════════════

export function useRequestWithdrawal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: dashboardService.requestWithdrawal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myWithdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      toast.success("تم إرسال طلب السحب بنجاح");
    },
    onError: (error) => {
      toast.error(error?.message || "فشل إرسال طلب السحب");
    },
  });
}

// ═══════════════════════════════════════════════════
// Mutations — Shipping
// ═══════════════════════════════════════════════════

export function useCreateShipment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: dashboardService.createShipment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["artistOrders"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
      toast.success("تم إنشاء الشحنة بنجاح 🚚");
    },
    onError: (error) => {
      toast.error(error?.message || "فشل إنشاء الشحنة");
    },
  });
}

export function useTrackShipment(orderId, enabled = false) {
  return useQuery({
    queryKey: ["trackShipment", orderId],
    queryFn: () => dashboardService.trackShipment(orderId),
    enabled: enabled && !!orderId,
    staleTime: 60 * 1000,
  });
}

export function useFeatureArtwork() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => artworksService.featureArtwork(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["myArtworks"] });
      queryClient.invalidateQueries({ queryKey: ["featuredArtworks"] });
      queryClient.invalidateQueries({ queryKey: ["artworks"] });
      toast.success(data?.message || "تم تمييز اللوحة بنجاح ✨ (تم إلغاء تمييز اللوحة السابقة إن وجدت)");
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || error?.message || "فشل تمييز اللوحة");
    },
  });
}

export function useUnfeatureArtwork() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => artworksService.unfeatureArtwork(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myArtworks"] });
      queryClient.invalidateQueries({ queryKey: ["featuredArtworks"] });
      queryClient.invalidateQueries({ queryKey: ["artworks"] });
      toast.success("تم إلغاء تمييز اللوحة بنجاح");
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || error?.message || "فشل إلغاء التمييز");
    },
  });
}
