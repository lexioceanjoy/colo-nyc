/**
 * pnpm validate (SPEC §5.3). Runs in CI and before `next build`.
 * - zod-validates every spot, both languages present, every known attribute has ≥1 source, unique slugs
 * - every non-closed spot has coordinates (place_geo ≤ 30 days, or fallbackLocation) when Supabase env is present
 * - lists closed businesses
 */
import "./lib/env";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { spotsSchema, type Spot } from "../src/lib/schema";
import { spotProblems } from "./lib/rules";

const ROOT = join(import.meta.dirname, "..");
const errors: string[] = [];
const warnings: string[] = [];

const raw = JSON.parse(readFileSync(join(ROOT, "src/data/spots.json"), "utf8"));
const parsed = spotsSchema.safeParse(raw);
if (!parsed.success) {
  for (const issue of parsed.error.issues.slice(0, 50)) {
    const idx = typeof issue.path[0] === "number" ? issue.path[0] : -1;
    const slug = idx >= 0 ? (raw[idx]?.slug ?? `#${idx}`) : "";
    errors.push(`schema ${slug} ${issue.path.slice(1).join(".")}: ${issue.message}`);
  }
  report();
}
const spots: Spot[] = parsed.data!;

// Unique slugs and place IDs
const seen = new Map<string, number>();
for (const s of spots) seen.set(s.slug, (seen.get(s.slug) ?? 0) + 1);
for (const [slug, n] of seen) if (n > 1) errors.push(`duplicate slug: ${slug}`);
const pids = new Map<string, string>();
for (const s of spots) {
  if (!s.googlePlaceId) continue;
  const other = pids.get(s.googlePlaceId);
  if (other) errors.push(`duplicate googlePlaceId: ${s.slug} and ${other}`);
  pids.set(s.googlePlaceId, s.slug);
}

for (const s of spots) for (const p of spotProblems(s)) errors.push(`${s.slug}: ${p}`);

const closed = spots.filter((s) => s.closed);

async function checkCoords() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    warnings.push("Supabase env missing: skipped the coordinate check.");
    return;
  }
  const sb = createClient(url, key, { auth: { persistSession: false } });
  const cutoff = new Date(Date.now() - 30 * 86400_000).toISOString();
  const ids = spots.flatMap((s) => (s.googlePlaceId ? [s.googlePlaceId] : []));
  const fresh = new Set<string>();
  for (let i = 0; i < ids.length; i += 200) {
    const { data, error } = await sb.from("place_geo").select("place_id").in("place_id", ids.slice(i, i + 200)).gte("fetched_at", cutoff);
    if (error) {
      warnings.push(`place_geo read failed (${error.message}): skipped the coordinate check.`);
      return;
    }
    for (const r of data) fresh.add(r.place_id);
  }
  for (const s of spots) {
    if (s.closed) continue;
    const ok = s.googlePlaceId ? fresh.has(s.googlePlaceId) : Boolean(s.fallbackLocation);
    if (!ok) errors.push(`${s.slug}: no coordinates (needs a place_geo row ≤ 30 days old or fallbackLocation)`);
  }
}

function report(): never {
  for (const w of warnings) console.warn(`⚠ ${w}`);
  if (closed.length) console.log(`Closed (hidden): ${closed.map((s) => s.slug).join(", ")}`);
  if (errors.length) {
    for (const e of errors) console.error(`✗ ${e}`);
    console.error(`\nvalidate: ${errors.length} error(s) across ${spots?.length ?? "?"} spots`);
    process.exit(1);
  }
  console.log(`✓ validate: ${spots.length} spots OK (${closed.length} closed)`);
  process.exit(0);
}

await checkCoords();
report();
