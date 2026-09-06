import { useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { DEFAULT_FILTERS } from "../constants/filters";

/**
 * Hook لإدارة filters في URL state
 * كل filter بيتحفظ في URL عشان يبقى shareable
 */
export function useArtworkFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Parse current filters from URL
  const filters = useMemo(() => {
    const parseArray = (value) => {
      if (!value) return [];
      return Array.isArray(value) ? value : value.split(",");
    };

    const parseIntOrNull = (value) => {
      const parsed = parseInt(value);
      return isNaN(parsed) ? null : parsed;
    };

    return {
      sort: searchParams.get("sort") || DEFAULT_FILTERS.sort,
      availability:
        searchParams.get("availability") || DEFAULT_FILTERS.availability,
      page: parseInt(searchParams.get("page")) || DEFAULT_FILTERS.page,
      limit: parseInt(searchParams.get("limit")) || DEFAULT_FILTERS.limit,
      search: searchParams.get("search") || DEFAULT_FILTERS.search,
      category: parseArray(searchParams.get("category")),
      medium: parseArray(searchParams.get("medium")),
      city: parseArray(searchParams.get("city")),
      size: parseArray(searchParams.get("size")),
      tags: parseArray(searchParams.get("tags")),
      minPrice: parseIntOrNull(searchParams.get("minPrice")),
      maxPrice: parseIntOrNull(searchParams.get("maxPrice")),
      verifiedArtists: searchParams.get("verifiedArtists") === "true",
    };
  }, [searchParams]);

  // Update filters
  const setFilter = useCallback(
    (key, value) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);

          // Reset to page 1 when filters change (except page itself)
          if (key !== "page") {
            next.set("page", "1");
          }

          // Handle null/empty values (remove from URL)
          if (
            value === null ||
            value === "" ||
            (Array.isArray(value) && value.length === 0)
          ) {
            next.delete(key);
          } else if (Array.isArray(value)) {
            next.set(key, value.join(","));
          } else if (value === DEFAULT_FILTERS[key]) {
            // Remove if it's the default value (cleaner URL)
            next.delete(key);
          } else {
            next.set(key, String(value));
          }

          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  // Toggle array filter (add/remove item)
  const toggleArrayFilter = useCallback(
    (key, value) => {
      const current = filters[key] || [];
      const newValue = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      setFilter(key, newValue);
    },
    [filters, setFilter],
  );

  // Clear all filters (except sort & availability defaults)
  const clearFilters = useCallback(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams();
        // Keep sort and availability
        if (prev.get("sort")) next.set("sort", prev.get("sort"));
        if (prev.get("availability"))
          next.set("availability", prev.get("availability"));
        return next;
      },
      { replace: true },
    );
  }, [setSearchParams]);

  // Count active filters (for badge)
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.category.length) count += filters.category.length;
    if (filters.medium.length) count += filters.medium.length;
    if (filters.city.length) count += filters.city.length;
    if (filters.size.length) count += filters.size.length;
    if (filters.tags.length) count += filters.tags.length;
    if (filters.minPrice !== null || filters.maxPrice !== null) count += 1;
    if (filters.search) count += 1;
    if (filters.verifiedArtists) count += 1;
    return count;
  }, [filters]);

  return {
    filters,
    setFilter,
    toggleArrayFilter,
    clearFilters,
    activeFiltersCount,
  };
}
