import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart, ArrowLeft, ShoppingCart, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { favoritesService } from "../services/favorites.service";
import { getMediaUrl } from "../../../utils/media";
import { ROUTES } from "../../../config/routes";

// ═══════════════════════════════════════════════════
// Main Page
// ═══════════════════════════════════════════════════
export default function FavoritesPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["favorites"],
    queryFn: () => favoritesService.getMyFavorites(),
    staleTime: 2 * 60 * 1000,
  });

  const removeMutation = useMutation({
    mutationFn: favoritesService.toggle,
    onMutate: async (artworkId) => {
      await queryClient.cancelQueries({ queryKey: ["favorites"] });
      const prev = queryClient.getQueryData(["favorites"]);
      queryClient.setQueryData(["favorites"], (old) => {
        if (!old) return old;
        const items = old?.favorites ?? old?.artworks ?? old ?? [];
        return {
          ...old,
          favorites: items.filter(
            (item) =>
              String(item._id ?? item.artwork?._id) !== String(artworkId)
          ),
        };
      });
      return { prev };
    },
    onSuccess: () => {
      toast.success("تمت الإزالة من المفضلة");
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
    onError: (_err, _id, ctx) => {
      queryClient.setQueryData(["favorites"], ctx?.prev);
      toast.error("فشل إزالة العنصر");
    },
  });

  // Support both response shapes: { favorites: [...] } or { artworks: [...] }
  const favorites = data?.favorites ?? data?.artworks ?? [];

  if (isLoading) return <LoadingSkeleton />;

  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      {/* ═══ Header ═══ */}
      <div className="bg-[var(--color-surface-container-lowest)] border-b border-[var(--color-outline-variant)]/40 sticky top-20 z-20">
        <div className="max-w-[1280px] mx-auto px-5 lg:px-16 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Heart
                className="w-5 h-5 text-[var(--color-primary)]"
                strokeWidth={1.5}
                fill="currentColor"
              />
              <h1 className="font-display text-xl text-[var(--color-on-surface)]">
                المفضلة
              </h1>
              {favorites.length > 0 && (
                <span className="text-sm font-body text-[var(--color-on-surface-variant)]">
                  ({favorites.length})
                </span>
              )}
            </div>
            <Link
              to={ROUTES.ARTWORKS}
              className="flex items-center gap-1.5 text-sm text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] transition-premium"
            >
              <span>تصفح المعرض</span>
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* ═══ Content ═══ */}
      <div className="max-w-[1280px] mx-auto px-5 lg:px-16 py-8">
        {favorites.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {favorites.map((item) => {
              // الـ API ممكن يرجع { artwork: {...} } أو directly الـ artwork object
              const artwork = item.artwork ?? item;
              return (
                <FavoriteCard
                  key={artwork._id}
                  artwork={artwork}
                  onRemove={() => removeMutation.mutate(String(artwork._id))}
                  isRemoving={removeMutation.isPending}
                />
                
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// Favorite Card
// ═══════════════════════════════════════════════════
function FavoriteCard({ artwork, onRemove, isRemoving }) {
  const imageUrl = getMediaUrl(artwork.coverImage ?? artwork.images?.[0]);
  const artistName =
    artwork.artist?.name ?? artwork.artistName ?? "فنان مجهول";

  return (
    <div className="group relative bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)]/50 overflow-hidden hover:border-[var(--color-primary)]/30 transition-premium">
      {/* Image */}
      <Link
        to={`/artworks/${artwork._id}`}
        className="block relative overflow-hidden aspect-3/4"
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={artwork.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-[var(--color-surface-container)] flex items-center justify-center">
            <Heart
              className="w-12 h-12 text-[var(--color-outline-variant)]"
              strokeWidth={1}
            />
          </div>
        )}

        {/* Plan Badge */}
        {artwork.artist?.plan?.id === "opal_prestige" && (
          <div className="absolute top-3 right-3 px-2 py-0.5 text-[10px] font-semibold tracking-widest uppercase bg-[var(--color-primary)] text-white">
            Prestige
          </div>
        )}
      </Link>

      {/* Remove Button */}
      <button
        onClick={onRemove}
        disabled={isRemoving}
        className="absolute top-3 left-3 w-8 h-8 flex items-center justify-center bg-black/50 text-white opacity-0 group-hover:opacity-100 hover:bg-[var(--color-error)] transition-premium disabled:opacity-40"
        title="إزالة من المفضلة"
      >
        <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
      </button>

      {/* Info */}
      <div className="p-4">
        <Link to={`/artworks/${artwork._id}`}>
          <h3 className="font-display text-base text-[var(--color-on-surface)] truncate hover:text-[var(--color-primary)] transition-premium">
            {artwork.title}
          </h3>
        </Link>
        <p className="text-xs font-body text-[var(--color-on-surface-variant)] mt-0.5 truncate">
          {artistName}
        </p>

        <div className="flex items-center justify-between mt-3">
          <span className="font-display text-sm text-[var(--color-primary)]">
            {artwork.price ? `${artwork.price.toLocaleString("ar-SA")} ر.س` : "—"}
          </span>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// Empty State
// ═══════════════════════════════════════════════════
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-20 h-20 rounded-full bg-[var(--color-surface-container)] flex items-center justify-center mb-6">
        <Heart
          className="w-9 h-9 text-[var(--color-outline-variant)]"
          strokeWidth={1}
        />
      </div>
      <h2 className="font-display text-2xl text-[var(--color-on-surface)] mb-2">
        المفضلة فارغة
      </h2>
      <p className="text-sm font-body text-[var(--color-on-surface-variant)] mb-8 max-w-xs">
        أضف الأعمال الفنية التي تعجبك إلى المفضلة وستجدها هنا
      </p>
      <Link
        to={ROUTES.ARTWORKS}
        className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--color-primary)] text-white text-sm font-semibold hover:bg-[var(--color-primary)]/90 transition-premium"
      >
        <span>تصفح المعرض</span>
        <ArrowLeft className="w-4 h-4" />
      </Link>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// Loading Skeleton
// ═══════════════════════════════════════════════════
function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      <div className="bg-[var(--color-surface-container-lowest)] border-b border-[var(--color-outline-variant)]/40 py-5">
        <div className="max-w-[1280px] mx-auto px-5 lg:px-16">
          <div className="h-7 w-32 bg-[var(--color-surface-container)] animate-pulse" />
        </div>
      </div>
      <div className="max-w-[1280px] mx-auto px-5 lg:px-16 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[3/4] bg-[var(--color-surface-container)]" />
              <div className="pt-4 space-y-2">
                <div className="h-4 bg-[var(--color-surface-container)] w-3/4" />
                <div className="h-3 bg-[var(--color-surface-container)] w-1/2" />
                <div className="h-4 bg-[var(--color-surface-container)] w-1/4 mt-2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
