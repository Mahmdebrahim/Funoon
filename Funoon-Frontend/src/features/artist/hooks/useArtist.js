import { useQuery } from "@tanstack/react-query";
import { artistService } from "../services/artist.service";

export function useArtist(artistId) {
  return useQuery({
    queryKey: ["artist", artistId],
    queryFn: () => artistService.getArtistProfile(artistId),
    enabled: !!artistId,
    staleTime: 2 * 60 * 1000,
  });
}
