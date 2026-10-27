import type { Spot } from "./schema";

/** Built from the place ID; no stored Google URI (SPEC §4.2). */
export function googleMapsUrl(spot: Pick<Spot, "name" | "googlePlaceId" | "address">) {
  const q = encodeURIComponent(spot.googlePlaceId ? spot.name : `${spot.name}, ${spot.address}`);
  return `https://www.google.com/maps/search/?api=1&query=${q}${spot.googlePlaceId ? `&query_place_id=${spot.googlePlaceId}` : ""}`;
}
