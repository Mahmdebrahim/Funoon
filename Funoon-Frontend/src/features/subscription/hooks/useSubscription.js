import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../../auth/stores/authStore";
import toast from "react-hot-toast";
import { subscriptionsService } from "../services/subscriptions.service";

export const useMySubscription = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: ["mySubscription"],
    queryFn: subscriptionsService.getMySubscription,
    enabled: isAuthenticated,
    staleTime: 2 * 60 * 1000,
    retry: false, 
  });
};

export function usePurchaseSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (planId) => subscriptionsService.purchase(planId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mySubscription"] });
    },
    onError: (error) => {
      toast.error(error?.message || "فشل إنشاء عملية الاشتراك");
    },
  });
}
