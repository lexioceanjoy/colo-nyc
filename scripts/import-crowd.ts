/**
 * pnpm data:crowd — fold crowd-confirmed core details (2+ people agree; confirmed_details()) into spots.json,
 * only where our researched value is still unknown. Source "community", medium confidence. Runs weekly.
 */
import "./lib/env";
import { appendFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { requireEnv } from "./lib/env";
import { readSpots, writeSpots, today } from "./lib/spots-io";
import type { HoursRange, Spot } from "../src/lib/schema";

const sb = createClient(requireEnv("NEXT_PUBLIC_SUPABASE_URL"), requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"), { auth: { persistSession: false } });
const { data, error } = await sb.rpc("confirmed_details");
if (error) {
  // Migration not applied yet on this project (function missing): skip instead of failing the weekly refresh.
  if (/confirmed_details|PGRST202|does not exist/i.test(error.message)) {
    console.warn(`crowd: skipped (${error.message}); apply supabase/migrations with pnpm db:push`);
    process.exit(0);
  }
  throw new Error(`confirmed_details: ${error.message}`);
}

/** "07-18|08-17" → Mon–Fri 07:00–18:00, Sat–Sun 08:00–17:00 ("closed" omits those days). */
export function hoursFromVote(v: string): HoursRange[] {
  const [wd, we] = v.split("|");
  const days = (r: string, ds: number[]) =>
    r === "closed" ? [] : ds.map((day) => ({ day: day as HoursRange["day"], open: `${r.split("-")[0]}:00`, close: r.split("-")[1] === "24" ? "00:00" : `${r.split("-")[1]}:00` }));
  return [...days(wd, [1, 2, 3, 4, 5]), ...days(we, [0, 6])].sort((a, b) => a.day - b.day);
}

const spots = readSpots();
const changes: string[] = [];
for (const r of (data as { spot_slug: string; field: string; value: string; votes: number }[]) ?? []) {
  const s = spots.find((x) => x.slug === r.spot_slug) as Spot | undefined;
  if (!s) continue;
  const note = { en: `Confirmed by ${r.votes} people who work here`, zh: `${r.votes} 位在这儿办公的人确认` };
  const attr = { confidence: "medium" as const, sources: ["community"], checkedAt: today(), note };
  if (r.field === "hours") {
    if (s.hours.value !== "unknown") continue;
    s.hours = { ...attr, value: hoursFromVote(r.value) };
  } else {
    const k = r.field as "wifi" | "outlets" | "laptopPolicy" | "noise";
    if (s.work[k].value !== "unknown") continue;
    (s.work[k] as { value: string }) = { ...attr, value: r.value } as never;
  }
  s.updatedAt = today();
  changes.push(`${s.slug}.${r.field} = ${r.value} (${r.votes} votes)`);
}
if (changes.length) writeSpots(spots);
console.log(`crowd: ${changes.length} confirmed detail(s) merged`);
for (const c of changes) console.log(`  ${c}`);
if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `crowd_changed=${changes.length > 0}\n`);
