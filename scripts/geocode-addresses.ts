/**
 * pnpm data:geocode — geocode OUR OWN `address` with NYC GeoSearch (NYC Planning Labs, open data; not Google).
 * Used for distance sorting in the list (SPEC §5.4: map-less list must not use Google coordinates).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { readSpots, ROOT } from "./lib/spots-io";

const OUT = join(ROOT, "src/data/address-geo.json");
const prev: Record<string, { lat: number; lng: number; address: string }> = (() => {
  try {
    return JSON.parse(readFileSync(OUT, "utf8"));
  } catch {
    return {};
  }
})();

const out: typeof prev = {};
const misses: string[] = [];
for (const s of readSpots()) {
  if (prev[s.slug]?.address === s.address) {
    out[s.slug] = prev[s.slug];
    continue;
  }
  const url = `https://geosearch.planninglabs.nyc/v2/search?size=1&text=${encodeURIComponent(s.address)}`;
  try {
    const r = await fetch(url);
    const j = (await r.json()) as { features?: { geometry: { coordinates: [number, number] }; properties: { confidence?: number } }[] };
    const f = j.features?.[0];
    if (f && (f.properties.confidence ?? 1) >= 0.6) {
      const [lng, lat] = f.geometry.coordinates;
      out[s.slug] = { lat: +lat.toFixed(5), lng: +lng.toFixed(5), address: s.address };
    } else misses.push(s.slug);
  } catch {
    misses.push(s.slug);
  }
  await new Promise((r) => setTimeout(r, 120));
}
writeFileSync(OUT, JSON.stringify(out, null, 1) + "\n");
console.log(`geocoded ${Object.keys(out).length} spots via NYC GeoSearch; misses: ${misses.join(", ") || "none"}`);
