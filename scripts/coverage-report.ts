/** pnpm data:report — M1 coverage report (SPEC §11 M1). Prints markdown. */
import { CORE_ATTRS } from "../src/lib/schema";
import { NEIGHBORHOODS } from "../src/data/neighborhoods";
import { readSpots } from "./lib/spots-io";

const all = readSpots();
const spots = all.filter((s) => !s.closed);
const n = spots.length;
const pct = (x: number, d = n) => `${d ? Math.round((x / d) * 100) : 0}%`;
const count = <K extends string>(f: (s: (typeof spots)[number]) => K) =>
  spots.reduce<Record<string, number>>((m, s) => ((m[f(s)] = (m[f(s)] ?? 0) + 1), m), {});
const table = (o: Record<string, number>) =>
  Object.entries(o)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${k} ${v}`)
    .join(" · ");

let cells = 0;
let medHigh = 0;
const conf = { high: 0, medium: 0, low: 0, unknown: 0 };
for (const s of spots) {
  for (const a of [s.hours, ...CORE_ATTRS.map((k) => s.work[k])]) {
    cells++;
    if (a.value === "unknown") conf.unknown++;
    else {
      conf[a.confidence]++;
      if (a.confidence !== "low") medHigh++;
    }
  }
}
const known = (f: (s: (typeof spots)[number]) => { value: unknown }) => spots.filter((s) => f(s).value !== "unknown").length;
const group = spots.filter((s) => s.work.groupCapacity.value === "4-6" || s.work.groupCapacity.value === "7+").length;
const freePublic = spots.filter((s) => s.category !== "cafe" && s.free).length;
const hoods = count((s) => NEIGHBORHOODS[s.neighborhood].en);
const topHood = Object.entries(hoods).sort((a, b) => b[1] - a[1])[0];

const lines = [
  `### Coverage report (${n} live spots, ${all.length - n} closed)`,
  `- By category: ${table(count((s) => s.category))}`,
  `- By borough: ${table(count((s) => s.borough))}`,
  `- Group-friendly (4+): ${group} (target ≥ 25) · Free public spaces: ${freePublic} (target ≥ 30)`,
  `- Largest neighborhood: ${topHood?.[0]} ${topHood?.[1]} (${pct(topHood?.[1] ?? 0)}; cap 15%)`,
  `- Confidence over ${cells} cells (11 core attrs × spots, unknowns in denominator): high ${pct(conf.high, cells)} · medium ${pct(conf.medium, cells)} · low ${pct(conf.low, cells)} · unknown ${pct(conf.unknown, cells)} → **medium+high ${pct(medHigh, cells)}** (target ≥ 55%)`,
  `- Known: wifi ${pct(known((s) => s.work.wifi))} · laptopPolicy ${pct(known((s) => s.work.laptopPolicy))} · hours ${pct(known((s) => s.hours))} (target ≥ 80% each)`,
  `- With place ID: ${spots.filter((s) => s.googlePlaceId).length} · fallbackLocation: ${spots.filter((s) => s.fallbackLocation).length}`,
];
console.log(lines.join("\n"));
