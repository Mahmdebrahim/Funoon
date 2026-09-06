import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useCartStore } from "../stores/cartStore";

export function useIsInCart(artworkId) {
  return useCartStore((s) => (artworkId ? !!s.isInCartMap[String(artworkId)] : false));
}

export function useCart() {
  const { addItem, removeItem, isInCart } = useCartStore();

  const addToCartMutation = useMutation({
    mutationFn: addItem,
    onSuccess: () => {
      toast.success("تمت الإضافة للسلة 🛒");
    },
    onError: (error) => {
      toast.error(error?.message || "فشل الإضافة للسلة");
    },
  });

  const addToCart = async (artworkId) => {
    return addToCartMutation.mutateAsync(String(artworkId));
  };

  return {
    addToCart,
    removeFromCart: removeItem,
    isInCart,
    isLoading: addToCartMutation.isPending,
  };
}
