/**
 * pnpm data:crowd — weekly: fold visitor reports into spots.json as the permanent record, using the SAME rules as the
 * live site (src/lib/crowd-rules.ts, Phase 1): 1 report → low, 2 → medium, 3+ → high; medium/high research only
 * changes when ≥2 people agree on a different value. Source "community". Opens a PR via the refresh Action.
 */
import "./lib/env";
import { appendFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { requireEnv } from "./lib/env";
import { readSpots, writeSpots, today } from "./lib/spots-io";
import { applyCrowd, type CrowdRow } from "../src/lib/crowd-rules";
import { flags } from "../src/config/flags";

const sb = createClient(requireEnv("NEXT_PUBLIC_SUPABASE_URL"), requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"), { auth: { persistSession: false } });
const fn = flags.crowdSingleReport ? "crowd_details" : "confirmed_details";
const { data, error } = await sb.rpc(fn);
if (error) {
  // Migration not applied yet on this project: skip instead of failing the weekly refresh.
  if (/crowd_details|confirmed_details|PGRST202|does not exist/i.test(error.message)) {
    console.warn(`crowd: skipped (${error.message}); apply supabase/migrations with pnpm db:push`);
    process.exit(0);
  }
  throw new Error(`${fn}: ${error.message}`);
}
// confirmed_details rows (flag off) have `votes` instead of `reports`/`total`/`disagree`/`last_at`.
const rows: CrowdRow[] = ((data as Record<string, unknown>[]) ?? []).map((r) => ({
  spot_slug: String(r.spot_slug),
  field: r.field as CrowdRow["field"],
  value: String(r.value),
  reports: Number(r.reports ?? r.votes),
  total: Number(r.total ?? r.votes),
  disagree: Boolean(r.disagree),
  last_at: String(r.last_at ?? new Date().toISOString()),
}));

const spots = readSpots();
const changes: string[] = [];
const merged = spots.map((s) => {
  const { spot, crowd } = applyCrowd(s, rows);
  const keys = Object.keys(crowd);
  if (!keys.length) return s;
  for (const k of keys) changes.push(`${s.slug}.${k} (${crowd[k as keyof typeof crowd]!.reports} report(s))`);
  return { ...spot, updatedAt: today() };
});
if (changes.length) writeSpots(merged);
console.log(`crowd: ${changes.length} visitor-reported detail(s) merged`);
for (const c of changes) console.log(`  ${c}`);
if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `crowd_changed=${changes.length > 0}\n`);
