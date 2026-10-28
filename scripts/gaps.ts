/**
 * pnpm data:gaps — data/gaps.md: only what's still missing among the 5 core details, sorted by the spots Lexi
 * is most likely to know (Brooklyn first, cafés before institutions, most-fixable first).
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { readSpots, ROOT, today } from "./lib/spots-io";
import { NEIGHBORHOODS } from "../src/data/neighborhoods";
import { coreKnown, coreMissing, MIN_CORE_KNOWN } from "../src/lib/core";

const BOROUGH_ORDER = { brooklyn: 0, queens: 1, manhattan: 2 } as const;
const CAT_ORDER: Record<string, number> = { cafe: 0, other_public: 1, hotel_lobby: 2, library: 3, pops: 4, museum: 5 };
const spots = readSpots()
  .filter((s) => !s.closed && coreMissing(s).length)
  .sort(
    (a, b) =>
      BOROUGH_ORDER[a.borough] - BOROUGH_ORDER[b.borough] ||
      // Spots one answer away from being listed come first: highest leverage for a quick check.
      Number(coreKnown(b) === MIN_CORE_KNOWN - 1) - Number(coreKnown(a) === MIN_CORE_KNOWN - 1) ||
      CAT_ORDER[a.category] - CAT_ORDER[b.category] ||
      NEIGHBORHOODS[a.neighborhood].en.localeCompare(NEIGHBORHOODS[b.neighborhood].en) ||
      a.name.localeCompare(b.name),
  );

const head = [
  `# What's still missing (${today()})`,
  "",
  "Only the 5 core details (Wi-Fi, outlets, laptop policy, noise, hours). Sorted Brooklyn → Queens → Manhattan; within each, spots one answer away from being listed first, then cafés. **Hidden** = fewer than 3 of 5 known, so not on the site yet. Fill any of these from experience in /admin (Verified) or tell Claude.",
  "",
  "| | spot | neighborhood | missing | known |",
  "|---|---|---|---|---|",
];
let borough = "";
const rows: string[] = [];
for (const s of spots) {
  if (s.borough !== borough) {
    borough = s.borough;
    rows.push(`| **${borough[0].toUpperCase() + borough.slice(1)}** | | | | |`);
  }
  const hidden = coreKnown(s) < MIN_CORE_KNOWN;
  rows.push(`| ${hidden ? "🔒 hidden" : ""} | ${s.name} (\`${s.slug}\`) | ${NEIGHBORHOODS[s.neighborhood].en} | ${coreMissing(s).join(", ")} | ${coreKnown(s)}/5 |`);
}
writeFileSync(join(ROOT, "data/gaps.md"), [...head, ...rows].join("\n") + "\n");
console.log(`gaps: ${spots.length} spots with missing core details (${spots.filter((s) => coreKnown(s) < MIN_CORE_KNOWN).length} hidden)`);
