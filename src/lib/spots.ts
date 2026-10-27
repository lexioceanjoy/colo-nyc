import "server-only";
import raw from "@/data/spots.json";
import type { Spot } from "./schema";
import { getPlaceGeo } from "./supabase/public";

// Curated spots are validated by `pnpm validate` (runs before every build), so a cast is safe here.
const spots = raw as unknown as Spot[];

export function getAllSpots(): Spot[] {
  return spots;
}

export function getVisibleSpots(): Spot[] {
  return spots.filter((s) => !s.closed);
}

export function getSpot(slug: string): Spot | undefined {
  return spots.find((s) => s.slug === slug);
}

export type { LatLng } from "./geo";
import type { LatLng } from "./geo";

/**
 * Coordinates for the Google map only (SPEC §5.4): Google lat/lng from `place_geo` (≤ 30 days old),
 * else our own non-Google fallbackLocation. Never used outside the Google map.
 */
export async function getMapCoords(list: Spot[]): Promise<Record<string, LatLng>> {
  const geo = await getPlaceGeo(list.flatMap((s) => (s.googlePlaceId ? [s.googlePlaceId] : [])));
  const out: Record<string, LatLng> = {};
  for (const s of list) {
    const g = s.googlePlaceId ? geo[s.googlePlaceId] : undefined;
    if (g) out[s.slug] = g;
    else if (s.fallbackLocation) out[s.slug] = { lat: s.fallbackLocation.lat, lng: s.fallbackLocation.lng };
  }
  return out;
}
