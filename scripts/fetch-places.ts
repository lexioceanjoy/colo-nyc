/**
 * pnpm data:fetch — Place Details (location,businessStatus) → Supabase place_geo; CLOSED_PERMANENTLY → our own `closed` flag.
 * Nothing from Google is written to the repo except the derived boolean (SPEC §4.2, §5.4).
 */
import "./lib/env";
import { appendFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { placeDetails, printEstimate, callCount } from "./lib/places";
import { readSpots, writeSpots, ROOT, today } from "./lib/spots-io";
import { requireEnv } from "./lib/env";

const sb = createClient(requireEnv("NEXT_PUBLIC_SUPABASE_URL"), requireEnv("SUPABASE_SERVICE_ROLE_KEY"), {
  auth: { persistSession: false },
});

const spots = readSpots();
const targets = spots.filter((s) => s.googlePlaceId);
printEstimate("detailsPro", targets.length);

const rows: { place_id: string; lat: number; lng: number; fetched_at: string }[] = [];
const changes: string[] = [];
const failures: string[] = [];
const now = new Date().toISOString();

for (const s of targets) {
  try {
    const d = await placeDetails(s.googlePlaceId!);
    if (d.location) rows.push({ place_id: s.googlePlaceId!, lat: d.location.latitude, lng: d.location.longitude, fetched_at: now });
    const closed = d.businessStatus === "CLOSED_PERMANENTLY";
    if (closed && !s.closed) {
      s.closed = true;
      s.updatedAt = today();
      changes.push(`closed: ${s.slug}`);
    } else if (!closed && s.closed) {
      delete s.closed;
      s.updatedAt = today();
      changes.push(`reopened: ${s.slug}`);
    }
  } catch (e) {
    failures.push(`${s.slug}: ${(e as Error).message}`);
  }
}

if (rows.length) {
  const { error } = await sb.from("place_geo").upsert(rows, { onConflict: "place_id" });
  if (error) throw new Error(`place_geo upsert failed: ${error.message}`);
}
const cutoff = new Date(Date.now() - 30 * 86400_000).toISOString();
await sb.from("place_geo").delete().lt("fetched_at", cutoff);

if (changes.length) writeSpots(spots);
const summary = `${today()} fetch-places: ${rows.length}/${targets.length} coords upserted, ${changes.length} closure change(s), ${failures.length} failure(s), ${callCount()} calls`;
console.log(summary);
for (const c of changes) console.log(`  ${c}`);
for (const f of failures) console.warn(`  ✗ ${f}`);
appendFileSync(join(ROOT, "data/closures.log"), [summary, ...changes.map((c) => `  ${c}`)].join("\n") + "\n");
// Signals for the GitHub Action (open a PR instead of pushing when the closed flag changed).
if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `closed_changed=${changes.length > 0}\n`);
writeFileSync(join(ROOT, ".fetch-places-summary.txt"), summary + "\n");
if (failures.length > targets.length / 2) process.exit(1);
