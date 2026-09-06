import {
  useQuery,
  useInfiniteQuery,
  keepPreviousData,
} from "@tanstack/react-query";
import { artworksService } from "../services/artworks.service";

/**
 * Hook لجلب اللوحات مع filters
 */
export function useArtworks(filters) {
  return useQuery({
    queryKey: ["artworks", filters],
    queryFn: () => artworksService.getArtworks(filters),
    placeholderData: keepPreviousData, // Smooth transition between pages
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook لجلب الـ filter options
 */
export function useFilterOptions() {
  return useQuery({
    queryKey: ["filterOptions"],
    queryFn: artworksService.getFilterOptions,
    staleTime: 30 * 60 * 1000, // 30 minutes (rarely changes)
  });
}

/**
 * Hook لجلب تفاصيل لوحة واحدة
 */
export function useArtwork(id) {
  return useQuery({
    queryKey: ["artwork", id],
    queryFn: () => artworksService.getArtworkById(id),
    enabled: !!id,
  });
}
