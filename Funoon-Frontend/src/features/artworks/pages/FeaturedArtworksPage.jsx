import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Sparkles, ChevronRight, ChevronLeft, Loader2, Star } from "lucide-react";
import { artworksService } from "../services/artworks.service";
import ArtworkCard from "../../../components/Ui/ArtworkCard";
import Button from "../../../components/Ui/Button";
import { ROUTES } from "../../../config/routes";

export default function FeaturedArtworksPage() {
  const [page, setPage] = useState(1);
  const limit = 12;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["featuredArtworks", page],
    queryFn: () => artworksService.getFeatured({ page, limit }),
    keepPreviousData: true,
  });

  const artworks = data?.artworks || [];
  const pagination = data?.pagination || { total: 0, pages: 1, page: 1 };

  return (
    <div className="min-h-screen bg-[var(--color-surface)] py-12 lg:py-16">
      <div className="max-w-[1280px] mx-auto px-5 lg:px-16">
        {/* ═══ Header Section ═══ */}
        <div className="text-center max-w-2xl mx-auto mb-12 lg:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#C5A880]/15 border border-[#C5A880]/30 text-[#C5A880] text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>نخبة الفن السعودي 🌟</span>
          </div>
          <h1 className="text-3xl lg:text-5xl font-display font-bold text-[var(--color-on-surface)] mb-4">
            الأعمال المميزة
          </h1>
          <p className="text-base text-[var(--color-on-surface-variant)] leading-relaxed font-body">
            معرض استثنائي يجمع الأعمال اللامعة التي اختار فنانونا المتميزون بعناية تسليط الضوء عليها.
          </p>
        </div>

        {/* ═══ Content Section ═══ */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-8">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="bg-[var(--color-surface-container-low)] rounded-xl aspect-[3/4] animate-pulse"
              />
            ))}
          </div>
        ) : isError ? (
          <div className="text-center py-20 bg-[var(--color-surface-container-lowest)] rounded-2xl border border-[var(--color-outline-variant)]/40 p-8 max-w-md mx-auto">
            <p className="text-[var(--color-on-surface-variant)] mb-4">
              تعذّر تحميل اللوحات المميزة حالياً.
            </p>
            <Button variant="secondary" onClick={() => window.location.reload()}>
              إعادة التحميل
            </Button>
          </div>
        ) : artworks.length === 0 ? (
          /* Empty State */
          <div className="text-center py-20 px-4 bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)]/40 rounded-2xl max-w-xl mx-auto">
            <div className="w-16 h-16 rounded-full bg-[#C5A880]/10 text-[#C5A880] flex items-center justify-center mx-auto mb-4">
              <Star className="w-8 h-8 fill-[#C5A880]" />
            </div>
            <h2 className="text-xl font-display font-bold text-[var(--color-on-surface)] mb-2">
              لا توجد لوحات مميزة حالياً
            </h2>
            <p className="text-sm text-[var(--color-on-surface-variant)] mb-6 leading-relaxed">
              ترقّ لباقة Opal Prestige وكن أول من يقدم لوحته المميزة ليراها جميع زوار منصة فُنون!
            </p>
            <Link to={ROUTES.SUBSCRIPTIONS}>
              <Button variant="primary" icon={Sparkles}>
                ترقية اشتراكك كفنان
              </Button>
            </Link>
          </div>
        ) : (
          <>
            {/* Artworks Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-8 mb-12">
              {artworks.map((artwork) => (
                <ArtworkCard key={artwork._id} artwork={artwork} />
              ))}
            </div>

            {/* Pagination Controls */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-center gap-3 pt-6 border-t border-[var(--color-outline-variant)]/30">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-[var(--color-outline-variant)] text-[var(--color-on-surface)] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--color-surface-container-low)] transition-colors flex items-center gap-1"
                >
                  <ChevronRight className="w-4 h-4" />
                  <span>السابق</span>
                </button>

                <div className="flex items-center gap-1 px-3 py-1 text-sm font-semibold text-[var(--color-on-surface-variant)]">
                  <span>صفحة {page} من {pagination.pages}</span>
                </div>

                <button
                  onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                  disabled={page >= pagination.pages}
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-[var(--color-outline-variant)] text-[var(--color-on-surface)] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--color-surface-container-low)] transition-colors flex items-center gap-1"
                >
                  <span>التالي</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
