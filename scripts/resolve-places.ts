/**
 * pnpm data:resolve — find a Google place ID for every spot without one (SPEC §5.3).
 * Only the place ID is kept. Google's name/address are used in memory for matching and never written anywhere.
 */
import "./lib/env";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { NEIGHBORHOODS } from "../src/data/neighborhoods";
import { textSearch, printEstimate, callCount, DAILY_SAFE, type TextHit } from "./lib/places";
import { readSpots, writeSpots, ROOT, today } from "./lib/spots-io";
import type { Spot } from "../src/lib/schema";

const STOP = new Set(["the", "and", "of", "nyc", "new", "york", "cafe", "café", "coffee", "&", "at", "-", "library", "hotel", "co", "co."]);
const tokens = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\(.*?\)/g, " ")
    .split(/[^a-z0-9]+/)
    .filter((t) => t && !STOP.has(t));

export function nameSimilarity(a: string, b: string): number {
  const A = new Set(tokens(a));
  const B = new Set(tokens(b));
  if (!A.size || !B.size) return 0;
  const inter = [...A].filter((t) => B.has(t)).length;
  return inter / Math.min(A.size, B.size);
}

const BOROUGH_RE: Record<Spot["borough"], RegExp> = {
  manhattan: /New York, NY 10[0-2]\d\d/,
  brooklyn: /Brooklyn, NY 112\d\d/,
  queens: /(Long Island City|Astoria|Queens|Sunnyside|Woodside), NY 11[13]\d\d/,
};

function streetNumber(s: string) {
  return s.match(/^\s*(\d+[A-Za-z]?)\b/)?.[1];
}

// Official building names for spots whose everyday name differs from the venue's listing (logged in DECISIONS.md).
const QUERY_OVERRIDES: Record<string, { query: string; name: string }> = {
  "citigroup-center-atrium": { query: "601 Lexington Avenue atrium New York", name: "601 Lexington Avenue" },
  "dream-midtown-the-rickey": { query: "Dream Midtown hotel 210 W 55th St New York", name: "Dream Midtown" },
  "greenpoint-library": { query: "Greenpoint Library and Environmental Education Center Brooklyn", name: "Greenpoint Library and Environmental Education Center" },
  "nypl-schwarzman-rose-main-reading-room": { query: "Stephen A. Schwarzman Building New York Public Library", name: "Stephen A. Schwarzman Building" },
};

type Decision = { spot: Spot; hit?: TextHit; sim: number; boroughOk: boolean; streetOk: boolean; auto: boolean; reason: string };

async function main() {
  const spots = readSpots();
  // Quota: at most DAILY_SAFE.searchText per run; the rest resolve on the next run (only unresolved spots are queried).
  const pending = spots.filter((s) => !s.googlePlaceId && !s.fallbackLocation && !s.closed);
  const todo = pending.slice(0, DAILY_SAFE.searchText);
  if (pending.length > todo.length) console.log(`Quota slice: ${todo.length} of ${pending.length} today; run again tomorrow for the rest.`);
  printEstimate("textSearchPro", todo.length);
  if (!todo.length) return console.log("Nothing to resolve.");

  const decisions: Decision[] = [];
  for (const spot of todo) {
    const override = QUERY_OVERRIDES[spot.slug];
    const q = override?.query ?? `${spot.name} ${NEIGHBORHOODS[spot.neighborhood].en} New York`;
    const matchName = override?.name ?? spot.name;
    let hits: TextHit[] = [];
    try {
      hits = await textSearch(q);
    } catch (e) {
      decisions.push({ spot, sim: 0, boroughOk: false, streetOk: false, auto: false, reason: `error: ${(e as Error).message}` });
      continue;
    }
    const scored = hits
      .map((hit) => {
        const sim = nameSimilarity(matchName, hit.displayName?.text ?? "");
        const addr = hit.formattedAddress ?? "";
        const boroughOk = BOROUGH_RE[spot.borough].test(addr);
        const num = streetNumber(spot.address);
        const streetOk = Boolean(num && streetNumber(addr) === num);
        return { hit, sim, boroughOk, streetOk, rank: sim + (boroughOk ? 0.5 : 0) + (streetOk ? 0.5 : 0) };
      })
      .sort((a, b) => b.rank - a.rank);
    const best = scored[0];
    if (!best) {
      decisions.push({ spot, sim: 0, boroughOk: false, streetOk: false, auto: false, reason: "no results" });
      continue;
    }
    const auto = best.sim >= 0.75 && best.boroughOk;
    const accepted = auto || (best.sim >= 0.5 && best.boroughOk && best.streetOk);
    decisions.push({
      spot,
      hit: accepted ? best.hit : undefined,
      sim: best.sim,
      boroughOk: best.boroughOk,
      streetOk: best.streetOk,
      auto,
      reason: auto
        ? "auto: high name similarity + borough match"
        : accepted
          ? "picked: moderate name similarity, borough and street number match"
          : `unresolved: best candidate too weak (sim ${best.sim.toFixed(2)}, borough ${best.boroughOk}, street ${best.streetOk})`,
    });
    if (accepted) spot.googlePlaceId = best.hit.id;
  }

  // Duplicate IDs across spots mean one of the matches is wrong: unset both for review.
  const byId = new Map<string, Decision[]>();
  for (const d of decisions) if (d.hit) byId.set(d.hit.id, [...(byId.get(d.hit.id) ?? []), d]);
  for (const ds of byId.values())
    if (ds.length > 1)
      for (const d of ds) {
        d.spot.googlePlaceId = null;
        d.hit = undefined;
        d.reason = `unresolved: same place ID matched ${ds.map((x) => x.spot.slug).join(" + ")}`;
      }

  for (const d of decisions) if (d.hit) d.spot.updatedAt = today();
  writeSpots(spots);

  // Review file: our own data + place ID + scores only. No Google names/addresses (SPEC §5.4).
  const lines = [
    `# Place ID resolution review (${today()})`,
    "",
    "Google text is never stored. Columns: our slug · our address · chosen place ID · name similarity · borough match · street-number match · decision.",
    "",
    "| slug | our address | place ID | sim | borough | street | decision |",
    "|---|---|---|---|---|---|---|",
    ...decisions.map(
      (d) =>
        `| ${d.spot.slug} | ${d.spot.address} | ${d.hit?.id ?? "—"} | ${d.sim.toFixed(2)} | ${d.boroughOk ? "✓" : "✗"} | ${d.streetOk ? "✓" : "✗"} | ${d.reason} |`,
    ),
  ];
  writeFileSync(join(ROOT, "data/resolve-review.md"), lines.join("\n") + "\n");
  const n = decisions.filter((d) => d.hit).length;
  console.log(`Resolved ${n}/${decisions.length} (${decisions.filter((d) => d.auto).length} auto). Calls: ${callCount()}. See data/resolve-review.md`);
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
