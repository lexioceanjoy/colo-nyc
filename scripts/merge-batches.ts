/** pnpm data:merge — merge data/batches/batch-*.json into src/data/spots.json, keeping resolved place IDs. */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { spotSchema, type Spot } from "../src/lib/schema";
import { spotProblems } from "./lib/rules";
import { readSpots, writeSpots, ROOT } from "./lib/spots-io";

const dir = join(ROOT, "data/batches");

// Overlay mode: `pnpm data:merge fill-12 fill-13` replaces just those records on top of the CURRENT spots.json,
// so values that live only in spots.json (OSM import, crowd merges) are never rebuilt away.
const overlay = process.argv.slice(2);
if (overlay.length) {
  const current = readSpots();
  let n = 0;
  for (const name of overlay) {
    for (const item of JSON.parse(readFileSync(join(dir, `${name}.json`), "utf8")) as unknown[]) {
      const r = spotSchema.safeParse(item);
      const probs = r.success ? spotProblems(r.data) : [];
      if (!r.success || probs.length) {
        console.error(`✗ ${name} ${(item as { slug?: string }).slug}: ${r.success ? probs.join("; ") : r.error.issues.map((i) => i.path.join(".") + " " + i.message).join("; ")}`);
        process.exitCode = 1;
        continue;
      }
      const i = current.findIndex((s) => s.slug === r.data.slug);
      if (i < 0) continue;
      const prev = current[i];
      current[i] = { ...r.data, googlePlaceId: prev.googlePlaceId, ...(prev.fallbackLocation ? { fallbackLocation: prev.fallbackLocation } : {}), ...(prev.closed ? { closed: true } : {}) };
      n++;
    }
  }
  writeSpots(current);
  console.log(`overlay: ${n} record(s) updated from ${overlay.join(", ")}`);
  process.exit();
}
const existing = new Map(readSpots().map((s) => [s.slug, s]));
const merged = new Map<string, Spot>();
let rejected = 0;

// batch-* first, then fill-* (gap-fill passes override the batch record for the same slug).
for (const f of readdirSync(dir).filter((f) => /^(batch|fill)-\d+\.json$/.test(f)).sort()) {
  const isFill = f.startsWith("fill-");
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
    if (merged.has(r.data.slug) && !isFill) {
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
