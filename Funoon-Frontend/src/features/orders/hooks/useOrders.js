import { useQuery } from "@tanstack/react-query";
import { ordersService } from "../services/orders.service";

export function useMyOrders(filters = {}) {
  return useQuery({
    queryKey: ["myOrders", filters],
    queryFn: () => ordersService.getMyOrders(filters),
    staleTime: 15 * 1000, 
    refetchOnWindowFocus: true,
  });
}
