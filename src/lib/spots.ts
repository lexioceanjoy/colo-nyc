import "server-only";
import { cache } from "react";
import raw from "@/data/spots.json";
import type { Spot } from "./schema";
import type { Core5 } from "./core";
import { isListed } from "./core";
import { getPlaceGeo, getCrowdRows } from "./supabase/public";
import { applyCrowd, type CrowdApplied } from "./crowd-rules";
import { flags } from "@/config/flags";

// Curated spots are validated by `pnpm validate` (runs before every build), so a cast is safe here.
const spots = raw as unknown as Spot[];

/** The curated research only (spots.json), without crowd reports. Scripts and admin use this. */
export function getAllSpots(): Spot[] {
  return spots;
}

export type LiveSpot = Spot & { crowd?: Partial<Record<Core5, CrowdApplied>> };

/**
 * Curated spots with crowd reports applied (Phase 1 rules, src/lib/crowd-rules.ts). Cached per request.
 * Pages are ISR: a report triggers revalidatePath, so a new report shows (and can list a spot) right away.
 */
export const getLiveSpots = cache(async (): Promise<LiveSpot[]> => {
  if (!flags.crowdSingleReport) return spots;
  const rows = await getCrowdRows();
  if (!rows.length) return spots;
  return spots.map((s) => {
    const { spot, crowd } = applyCrowd(s, rows);
    return Object.keys(crowd).length ? { ...spot, crowd } : s;
  });
});

/** Listed on the site: open and at least 3 of the 5 core details known, counting crowd reports. */
export async function getVisibleSpots(): Promise<LiveSpot[]> {
  return (await getLiveSpots()).filter(isListed);
}

export async function getSpot(slug: string): Promise<LiveSpot | undefined> {
  return (await getLiveSpots()).find((s) => s.slug === slug);
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
