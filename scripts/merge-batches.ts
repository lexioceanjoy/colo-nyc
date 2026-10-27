/** pnpm data:merge — merge data/batches/batch-*.json into src/data/spots.json, keeping resolved place IDs. */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { spotSchema, type Spot } from "../src/lib/schema";
import { spotProblems } from "./lib/rules";
import { readSpots, writeSpots, ROOT } from "./lib/spots-io";

const dir = join(ROOT, "data/batches");
const existing = new Map(readSpots().map((s) => [s.slug, s]));
const merged = new Map<string, Spot>();
let rejected = 0;

for (const f of readdirSync(dir).filter((f) => /^batch-\d+\.json$/.test(f)).sort()) {
  const arr = JSON.parse(readFileSync(join(dir, f), "utf8")) as unknown[];
  for (const item of arr) {
    const r = spotSchema.safeParse(item);
    const label = (item as { slug?: string })?.slug ?? "?";
    if (!r.success) {
      rejected++;
      console.error(`✗ ${f} ${label}: ${r.error.issues.map((i) => `${i.path.join(".")} ${i.message}`).join("; ")}`);
      continue;
    }
    const probs = spotProblems(r.data);
    if (probs.length) {
      rejected++;
      console.error(`✗ ${f} ${label}: ${probs.join("; ")}`);
      continue;
    }
    if (merged.has(r.data.slug)) {
      console.warn(`⚠ duplicate slug ${r.data.slug} in ${f}; keeping the first`);
      continue;
    }
    const prev = existing.get(r.data.slug);
    merged.set(r.data.slug, {
      ...r.data,
      googlePlaceId: prev?.googlePlaceId ?? r.data.googlePlaceId,
      ...(prev?.fallbackLocation ? { fallbackLocation: prev.fallbackLocation } : {}),
      ...(prev?.closed ? { closed: true } : {}),
      ...(prev?.status === "verified" ? { status: prev.status, verifiedBy: prev.verifiedBy, verifiedAt: prev.verifiedAt } : {}),
    });
  }
}
// Spots that exist only in spots.json (hand-added later) are kept.
for (const [slug, s] of existing) if (!merged.has(slug)) merged.set(slug, s);

const out = [...merged.values()].sort((a, b) => a.slug.localeCompare(b.slug));
writeSpots(out);
console.log(`merged ${out.length} spots (${rejected} rejected)`);
if (rejected) process.exitCode = 1;
