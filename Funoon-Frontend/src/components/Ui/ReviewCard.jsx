import { User, Palette, Eye, EyeOff, ShieldAlert } from "lucide-react";
import StarRating from "./StarRating";
import { getMediaUrl } from "../../utils/media";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

export default function ReviewCard({ review, isAdmin = false, onHide, onUnhide }) {
  if (!review) return null;

  const { reviewer, rating, comment, createdAt, artwork, isHidden, hiddenReason } = review;
  const reviewerName = reviewer?.name || "مشتري فنون";
  const avatarUrl = getMediaUrl(reviewer?.avatar);

  let formattedDate = "";
  if (createdAt) {
    try {
      formattedDate = formatDistanceToNow(new Date(createdAt), {
        addSuffix: true,
        locale: ar,
      });
    } catch {
      formattedDate = new Date(createdAt).toLocaleDateString("ar-SA");
    }
  }

  return (
    <div
      className={`relative p-5 shadow-sm transition-all duration-300 ${
        isHidden
          ? "bg-red-500/5 border border-red-500/30 opacity-75"
          : "bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)]/40 hover:border-[var(--color-outline-variant)]/80"
      }`}
    >
      {/* Hidden Badge for Admin */}
      {isHidden && (
        <div className="mb-3 flex items-center justify-between gap-2 p-2 bg-red-500/10 border border-red-500/20 text-red-700 text-xs font-body">
          <div className="flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
            <span>
              <strong>تم إخفاء التقييم:</strong> {hiddenReason || "مخفي بواسطة الأدمن"}
            </span>
          </div>
          {isAdmin && onUnhide && (
            <button
              onClick={() => onUnhide(review._id)}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 transition-colors shrink-0"
            >
              <Eye className="w-3 h-3" />
              <span>إظهار</span>
            </button>
          )}
        </div>
      )}

      {/* Header: Avatar + Info + Stars */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-[var(--color-surface-container)] shrink-0 border border-[var(--color-outline-variant)]/30">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={reviewerName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[var(--color-on-surface-variant)]">
                <User className="w-5 h-5" strokeWidth={1.5} />
              </div>
            )}
          </div>
          <div>
            <h4 className="font-display text-sm font-semibold text-[var(--color-on-surface)] flex items-center gap-2">
              <span>{reviewerName}</span>
            </h4>
            {formattedDate && (
              <span className="text-[11px] font-body text-[var(--color-on-surface-variant)]">
                {formattedDate}
              </span>
            )}
          </div>
        </div>

        {/* Rating Stars + Admin Hide action */}
        <div className="flex flex-col items-end gap-1">
          <StarRating value={rating} size="sm" />
          {isAdmin && !isHidden && onHide && (
            <button
              onClick={() => onHide(review._id)}
              className="inline-flex items-center gap-1 text-[11px] font-body text-red-600 hover:text-red-700 hover:underline mt-1"
            >
              <EyeOff className="w-3 h-3" />
              <span>إخفاء</span>
            </button>
          )}
        </div>
      </div>

      {/* Artwork title reference if present */}
      {artwork?.title && (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[var(--color-surface-container-low)] text-[11px] font-body text-[var(--color-on-surface-variant)] mb-3">
          <Palette className="w-3 h-3 text-[var(--color-secondary)]" strokeWidth={1.5} />
          <span>تقييم للوحة: {artwork.title}</span>
        </div>
      )}

      {/* Comment */}
      {comment && (
        <p className="text-sm font-body text-[var(--color-on-surface)] leading-relaxed bg-[var(--color-surface-container-lowest)] pt-1">
          {comment}
        </p>
      )}
    </div>
  );
}
