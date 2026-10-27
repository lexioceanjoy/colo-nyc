// Minimal Places API (New) client for scripts only. Server key never reaches client code.
import { requireEnv } from "./env";

const BASE = "https://places.googleapis.com/v1";
export const MAX_CALLS_PER_RUN = 1000;

/**
 * Price tiers per 1,000 calls (Places API New, Oct 2026 pricing page; re-check before big runs).
 * Field masks decide the SKU: ids-only Text Search = Essentials (IDs Only); displayName/formattedAddress = Pro;
 * Place Details location only = Essentials; + businessStatus = Pro.
 */
export const SKUS = {
  textSearchPro: { label: "Text Search Pro (id, displayName, formattedAddress)", per1000: 32, freePerMonth: 5000 },
  detailsPro: { label: "Place Details Pro (location, businessStatus)", per1000: 17, freePerMonth: 5000 },
} as const;

export function printEstimate(sku: keyof typeof SKUS, calls: number) {
  const s = SKUS[sku];
  const gross = (calls / 1000) * s.per1000;
  console.log(`\nCost estimate: ${calls} × ${s.label}`);
  console.log(`  list price ≈ $${gross.toFixed(2)} (${s.per1000}/1k); free monthly allowance ${s.freePerMonth} calls → expected bill $0.00 if under it.`);
  if (calls > MAX_CALLS_PER_RUN) {
    console.error(`Aborting: ${calls} calls exceeds the ${MAX_CALLS_PER_RUN}-call per-run cap (CLAUDE.md rule 5).`);
    process.exit(1);
  }
}

let calls = 0;
async function call<T>(url: string, init: RequestInit, mask: string): Promise<T> {
  if (++calls > MAX_CALLS_PER_RUN) throw new Error("per-run call cap reached");
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": requireEnv("GOOGLE_PLACES_SERVER_KEY"),
      "X-Goog-FieldMask": mask,
      ...init.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw Object.assign(new Error(`Places ${res.status}: ${body.slice(0, 300)}`), { status: res.status });
  }
  return res.json() as Promise<T>;
}

export type TextHit = { id: string; displayName?: { text: string }; formattedAddress?: string };

export async function textSearch(query: string): Promise<TextHit[]> {
  const r = await call<{ places?: TextHit[] }>(
    `${BASE}/places:searchText`,
    {
      method: "POST",
      body: JSON.stringify({
        textQuery: query,
        pageSize: 5,
        locationBias: { rectangle: { low: { latitude: 40.57, longitude: -74.05 }, high: { latitude: 40.88, longitude: -73.83 } } },
      }),
    },
    "places.id,places.displayName,places.formattedAddress",
  );
  return r.places ?? [];
}

export type Details = { location?: { latitude: number; longitude: number }; businessStatus?: string };

export async function placeDetails(id: string): Promise<Details> {
  return call<Details>(`${BASE}/places/${encodeURIComponent(id)}`, { method: "GET" }, "location,businessStatus");
}

export const callCount = () => calls;
