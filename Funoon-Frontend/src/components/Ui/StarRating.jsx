import { useState } from "react";
import { Star } from "lucide-react";

export default function StarRating({
  value = 0,
  onChange,
  size = "md",
  showNumber = false,
  className = "",
}) {
  const [hoverValue, setHoverValue] = useState(null);

  const isInteractive = typeof onChange === "function";
  const displayValue = hoverValue !== null ? hoverValue : value;

  const sizeClasses = {
    sm: "w-3.5 h-3.5",
    md: "w-5 h-5",
    lg: "w-7 h-7",
  };

  const currentSizeClass = sizeClasses[size] || sizeClasses.md;

  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      <div className="flex items-center gap-0.5" dir="ltr">
        {[1, 2, 3, 4, 5].map((starIndex) => {
          const isFilled = starIndex <= Math.round(displayValue);

          return (
            <button
              key={starIndex}
              type="button"
              disabled={!isInteractive}
              onClick={() => isInteractive && onChange(starIndex)}
              onMouseEnter={() => isInteractive && setHoverValue(starIndex)}
              onMouseLeave={() => isInteractive && setHoverValue(null)}
              className={`${
                isInteractive
                  ? "cursor-pointer transition-transform hover:scale-110 focus:outline-none"
                  : "cursor-default"
              }`}
              aria-label={`تقييم ${starIndex} من 5`}
            >
              <Star
                className={`${currentSizeClass} ${
                  isFilled
                    ? "fill-amber-400 text-amber-400"
                    : "text-[var(--color-outline-variant)]"
                } transition-colors duration-150`}
              />
            </button>
          );
        })}
      </div>
      {showNumber && (
        <span className="text-xs font-body font-semibold text-[var(--color-on-surface)] mr-1">
          {Number(value || 0).toFixed(1)}
        </span>
      )}
    </div>
  );
}
