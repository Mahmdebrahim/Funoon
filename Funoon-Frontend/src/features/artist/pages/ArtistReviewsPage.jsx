import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { ChevronLeft, Star, MessageSquare, ArrowRight, User } from "lucide-react";
import { reviewService } from "../../reviews/services/review.service";
import { artistService } from "../services/artist.service";
import StarRating from "../../../components/Ui/StarRating";
import ReviewCard from "../../../components/Ui/ReviewCard";
import { getMediaUrl } from "../../../utils/media";
import { ROUTES } from "../../../config/routes";

export default function ArtistReviewsPage() {
  const { id } = useParams();
  const [page, setPage] = useState(1);
  const limit = 10;

  // Fetch Artist Info
  const { data: artist } = useQuery({
    queryKey: ["artist-profile", id],
    queryFn: () => artistService.getArtistProfile(id),
  });

  // Fetch Reviews with Pagination & Summary
  const { data: reviewsData, isLoading } = useQuery({
    queryKey: ["artist-reviews", id, page],
    queryFn: () => reviewService.getArtistReviews(id, { page, limit }),
    placeholderData: keepPreviousData,
  });

  const reviews = reviewsData?.reviews || [];
  const summary = reviewsData?.summary || { avgRating: 0, total: 0, distribution: {} };
  const pagination = reviewsData?.pagination || { total: 0, page: 1, pages: 1 };
  const distribution = summary.distribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  const totalReviews = summary.total || 0;

  return (
    <div className="min-h-screen bg-[var(--color-surface)] py-8">
      <div className="max-w-[1280px] mx-auto px-5 lg:px-16">
        {/* ═══ Breadcrumb ═══ */}
        <nav className="flex items-center gap-2 text-xs font-body text-[var(--color-on-surface-variant)] mb-6">
          <Link to={ROUTES.HOME} className="hover:text-[var(--color-primary)] transition-premium">
            الرئيسية
          </Link>
          <ChevronLeft className="w-3 h-3" />
          <Link to={ROUTES.ARTISTS} className="hover:text-[var(--color-primary)] transition-premium">
            الفنانون
          </Link>
          <ChevronLeft className="w-3 h-3" />
          {artist?._id && (
            <>
              <Link
                to={`/artists/${artist._id}`}
                className="hover:text-[var(--color-primary)] transition-premium"
              >
                {artist.name}
              </Link>
              <ChevronLeft className="w-3 h-3" />
            </>
          )}
          <span className="text-[var(--color-on-surface)] font-medium">التقييمات</span>
        </nav>

        {/* ═══ Artist Header ═══ */}
        <div className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)]/40 p-6 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-[var(--color-surface-container)] shrink-0 border border-[var(--color-outline-variant)]/30">
              {artist?.avatar ? (
                <img
                  src={getMediaUrl(artist.avatar)}
                  alt={artist.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-8 h-8 text-[var(--color-on-surface-variant)]" strokeWidth={1.5} />
                </div>
              )}
            </div>
            <div>
              <h1 className="font-display text-2xl text-[var(--color-on-surface)] mb-1">
                تقييمات {artist?.name || "الفنان"}
              </h1>
              <div className="flex items-center gap-2">
                <StarRating value={summary.avgRating} showNumber size="sm" />
                <span className="text-xs font-body text-[var(--color-on-surface-variant)]">
                  ({totalReviews} تقييم)
                </span>
              </div>
            </div>
          </div>

          <Link
            to={`/artists/${id}`}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-body font-semibold text-[var(--color-on-surface)] border border-[var(--color-outline-variant)]/60 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-premium"
          >
            <span>العودة لبروفايل الفنان</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* ═══ Summary & Distribution Chart Section ═══ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {/* Average Rating Box */}
          <div className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)]/40 p-6 flex flex-col items-center justify-center text-center">
            <div className="font-display text-5xl text-[var(--color-primary)] mb-2">
              {Number(summary.avgRating || 0).toFixed(1)}
            </div>
            <StarRating value={summary.avgRating} size="lg" className="mb-2" />
            <p className="text-xs font-body text-[var(--color-on-surface-variant)]">
              بناءً على {totalReviews} تقييم من المترين
            </p>
          </div>

          {/* Rating Distribution Chart */}
          <div className="md:col-span-2 bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)]/40 p-6">
            <h3 className="text-xs font-body font-semibold tracking-[0.15em] uppercase text-[var(--color-on-surface-variant)] mb-4">
              توزيع التقييمات
            </h3>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = distribution[star] || 0;
                const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;

                return (
                  <div key={star} className="flex items-center gap-3 text-xs font-body">
                    <span className="w-12 text-left shrink-0 text-[var(--color-on-surface)] flex items-center justify-end gap-1">
                      <span>{star}</span>
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400 inline" />
                    </span>

                    {/* Progress Bar */}
                    <div className="flex-1 h-3 bg-[var(--color-surface-container)] overflow-hidden rounded-full">
                      <div
                        className="h-full bg-amber-400 transition-all duration-500 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>

                    <span className="w-12 text-left shrink-0 text-[var(--color-on-surface-variant)] font-mono">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ═══ Reviews List ═══ */}
        <div className="space-y-4 mb-8">
          <h3 className="text-lg font-display text-[var(--color-on-surface)] mb-4">
            آراء المشتريين
          </h3>

          {isLoading ? (
            <LoadingState />
          ) : reviews.length === 0 ? (
            <EmptyState />
          ) : (
            reviews.map((rev) => <ReviewCard key={rev._id} review={rev} />)
          )}
        </div>

        {/* ═══ Pagination ═══ */}
        {pagination.pages > 1 && (
          <div className="flex justify-center gap-2 pt-6">
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-9 h-9 flex items-center justify-center text-xs font-body font-semibold transition-premium ${
                  p === page
                    ? "bg-[var(--color-primary)] text-white"
                    : "border border-[var(--color-outline-variant)] text-[var(--color-on-surface)] hover:border-[var(--color-primary)]"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-28 bg-[var(--color-surface-container)] animate-pulse" />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="py-16 text-center bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)]/40 p-8">
      <MessageSquare className="w-12 h-12 text-[var(--color-on-surface-variant)] mx-auto mb-3" strokeWidth={1} />
      <h4 className="font-display text-lg text-[var(--color-on-surface)] mb-1">
        لا توجد تقييمات بعد
      </h4>
      <p className="text-xs font-body text-[var(--color-on-surface-variant)]">
        لم يحصل هذا الفنان على تقييمات من المشتريين حتى الآن.
      </p>
    </div>
  );
}
