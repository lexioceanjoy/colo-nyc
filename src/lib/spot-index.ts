import "server-only";
import { getVisibleSpots } from "./spots";

export type SpotIndex = Record<string, { name: string; neighborhood: string; borough: string }>;

/** Tiny slug → name map for session lists and the host form. */
export async function getSpotIndex(): Promise<SpotIndex> {
  return Object.fromEntries((await getVisibleSpots()).map((s) => [s.slug, { name: s.name, neighborhood: s.neighborhood, borough: s.borough }]));
}
