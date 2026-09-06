import { useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import {
  Search,
  X,
  User,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Award,
  CheckCircle2
} from "lucide-react";
import { getMediaUrl } from "../../../utils/media";
import { artistService } from "../services/artist.service";
import StarRating from "../../../components/Ui/StarRating";
import badge from "../../../assets/badge.png";

// ═══════════════════════════════════════════════════
// Main Page
// ═══════════════════════════════════════════════════
export default function ArtistsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo(
    () => ({
      page: parseInt(searchParams.get("page")) || 1,
      limit: 12,
      search: searchParams.get("search") || "",
    }),
    [searchParams]
  );

  const setFilter = (key, value) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (key !== "page") next.set("page", "1");
        if (!value) next.delete(key);
        else next.set(key, String(value));
        return next;
      },
      { replace: true }
    );
  };

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["artists", filters],
    queryFn: () => artistService.getAllArtists(filters),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
  });

  const artists = data?.artists || [];
  const pagination = data?.pagination || { total: 0, page: 1, pages: 0 };

  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      {/* ═══ Header Bar ═══ */}
      <div className="bg-[var(--color-surface-container-lowest)] border-b border-[var(--color-outline-variant)]/40 sticky top-20 z-20">
        <div className="max-w-[1280px] mx-auto px-5 lg:px-16 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <h1 className="font-display text-xl text-[var(--color-on-surface)]">
                الفنانون
              </h1>
              <span className="text-sm font-body text-[var(--color-on-surface-variant)]">
                {isFetching ? "..." : `${pagination.total || 0} فنان`}
              </span>
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-72">
              <Search
                className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-on-surface-variant)] pointer-events-none"
                strokeWidth={1.5}
              />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilter("search", e.target.value)}
                placeholder="ابحث باسم الفنان أو المدينة..."
                className="w-full pr-10 pl-10 py-2.5 bg-[var(--color-surface-container-low)] border border-[var(--color-outline-variant)]/50 text-sm font-body focus:outline-none focus:border-[var(--color-secondary)] transition-premium"
              />
              {filters.search && (
                <button
                  onClick={() => setFilter("search", "")}
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                >
                  <X className="w-4 h-4 text-[var(--color-on-surface-variant)]" strokeWidth={1.5} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Grid ═══ */}
      <div className="max-w-[1280px] mx-auto px-5 lg:px-16 py-8">
        {isLoading ? (
          <LoadingGrid />
        ) : artists.length === 0 ? (
          <EmptyState search={filters.search} />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {artists.map((artist) => (
                <ArtistCard key={artist._id} artist={artist} />
              ))}
            </div>

            {pagination.pages > 1 && (
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.pages}
                onPageChange={(p) => setFilter("page", p)}
                isLoading={isFetching}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// Artist Card
// ═══════════════════════════════════════════════════
function ArtistCard({ artist }) {
  const avatarUrl = getMediaUrl(artist.avatar);
  const isPrestige = artist.plan?.id === "opal_prestige";
  const isPlus = artist.plan?.id === "opal_plus";
  const isVerified = artist.isVerified;

  return (
    <Link
      to={`/artists/${artist._id}`}
      className="group relative  overflow-hidden hover:border-[var(--color-primary)]/40 transition-premium block"
    >
      {/* Plan Badge */}
      {(isPrestige || isPlus) && (
        <div
          className={`absolute top-3 right-3 z-10 flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold tracking-widest uppercase ${isPrestige ? "bg-[var(--color-primary)] text-white" : "bg-[var(--color-secondary)]/90 text-white"
            }`}
        >
          <Award className="w-2.5 h-2.5" strokeWidth={2.5} />
          {artist.plan?.label}
        </div>
      )}

      {/* Avatar */}
      <div className="aspect-square overflow-hidden bg-[var(--color-surface-container)]">
        {avatarUrl ? (
          <img src={avatarUrl} alt={artist.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <User className="w-16 h-16 text-[var(--color-outline-variant)]" strokeWidth={1} />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        {/* Name + Verified Badge */}
        <div className="flex items-center gap-1.5 mb-1">
          <h3 className="font-display text-base text-[var(--color-on-surface)] truncate group-hover:text-[var(--color-primary)] transition-premium">
            {artist.name}
          </h3>
          {isVerified && (
            <img src={badge} alt="badge" className="w-8 h-8 object-contain mt-1" />
          )}
        </div>

        {/* Rating Stars */}
        {
          <div className="flex items-center gap-1 mb-2">
            <StarRating value={artist.avgRating || 0} size="sm" showNumber />
            <span className="text-[11px] font-body text-[var(--color-on-surface-variant)]">
              ({artist.reviewsCount || 0})
            </span>
          </div>
        }

        {artist.bio && (
          <p className="text-xs font-body text-[var(--color-on-surface-variant)] mt-2 line-clamp-2 leading-relaxed">
            {artist.bio}
          </p>
        )}
      </div>
    </Link>
  );
}

// ═══════════════════════════════════════════════════
// Pagination
// ═══════════════════════════════════════════════════
function Pagination({ currentPage, totalPages, onPageChange, isLoading }) {
  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - 1 && i <= currentPage + 1)
    ) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...");
    }
  }

  return (
    <div className="flex items-center justify-center gap-2 pt-12">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1 || isLoading}
        className="w-10 h-10 flex items-center justify-center border border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] hover:border-[var(--color-secondary)] hover:text-[var(--color-secondary)] disabled:opacity-30 disabled:cursor-not-allowed transition-premium"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {pages.map((page, idx) =>
        page === "..." ? (
          <span
            key={`ellipsis-${idx}`}
            className="w-10 h-10 flex items-center justify-center text-[var(--color-on-surface-variant)]"
          >
            ...
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            disabled={isLoading}
            className={`w-10 h-10 flex items-center justify-center text-sm font-body transition-premium ${page === currentPage
                ? "bg-[var(--color-primary)] text-white"
                : "border border-[var(--color-outline-variant)] text-[var(--color-on-surface)] hover:border-[var(--color-secondary)] hover:text-[var(--color-secondary)]"
              } ${isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          >
            {page}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages || isLoading}
        className="w-10 h-10 flex items-center justify-center border border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] hover:border-[var(--color-secondary)] hover:text-[var(--color-secondary)] disabled:opacity-30 disabled:cursor-not-allowed transition-premium"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════
function LoadingGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-square bg-[var(--color-surface-container)]" />
          <div className="pt-4 space-y-2 px-4 pb-4">
            <div className="h-4 bg-[var(--color-surface-container)] w-3/4" />
            <div className="h-3 bg-[var(--color-surface-container)] w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ search }) {
  return (
    <div className="py-20 text-center">
      <div className="w-20 h-20 rounded-full bg-[var(--color-surface-container)] flex items-center justify-center mx-auto mb-6">
        <User
          className="w-9 h-9 text-[var(--color-outline-variant)]"
          strokeWidth={1}
        />
      </div>
      <h2 className="font-display text-2xl text-[var(--color-on-surface)] mb-2">
        {search ? `لا توجد نتائج لـ "${search}"` : "لا يوجد فنانون"}
      </h2>
      <p className="text-sm font-body text-[var(--color-on-surface-variant)]">
        {search ? "جرّب كلمات بحث مختلفة" : "سيتم إضافة فنانين قريباً"}
      </p>
    </div>
  );
}
