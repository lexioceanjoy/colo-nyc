import type { HoursRange } from "../../src/lib/schema";

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const;
const IDX: Record<string, number> = Object.fromEntries(DAYS.map((d, i) => [d, i]));

/**
 * Parse the common subset of OSM `opening_hours` into our ranges, e.g.
 * "Mo-Fr 07:00-18:00; Sa,Su 08:00-17:00", "Mo-Su 07:00-19:00", "24/7", "Mo-Fr 08:00-12:00,13:00-17:00; Su off".
 * Returns null for anything we can't read unambiguously (PH, months, sunrise, comments, week numbers): no guessing.
 */
export function parseOsmHours(raw: string): HoursRange[] | null {
  // We don't model public holidays, so "PH off"/"PH closed" can be dropped; any other PH rule is refused below.
  const s = raw.replace(/;\s*PH\s+(off|closed)\s*$/i, "").trim();
  if (s === "24/7") return [0, 1, 2, 3, 4, 5, 6].map((day) => ({ day: day as HoursRange["day"], open: "00:00", close: "00:00" }));
  if (/PH|SH|sunrise|sunset|dawn|dusk|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|week|"|\[|\+|\|\|/.test(s)) return null;
  const byDay = new Map<number, HoursRange[]>();
  for (const ruleRaw of s.split(";")) {
    const rule = ruleRaw.trim();
    if (!rule) continue;
    const m = rule.match(/^((?:(?:Mo|Tu|We|Th|Fr|Sa|Su)(?:-(?:Mo|Tu|We|Th|Fr|Sa|Su))?)(?:,(?:Mo|Tu|We|Th|Fr|Sa|Su)(?:-(?:Mo|Tu|We|Th|Fr|Sa|Su))?)*)?\s*(.*)$/);
    if (!m) return null;
    const daySpec = m[1] ?? "Mo-Su";
    const timeSpec = m[2].trim();
    const days: number[] = [];
    for (const part of daySpec.split(",")) {
      const [a, b] = part.split("-");
      if (!(a in IDX) || (b && !(b in IDX))) return null;
      const start = IDX[a];
      const end = b ? IDX[b] : start;
      for (let d = start; ; d = (d + 1) % 7) {
        days.push(d);
        if (d === end) break;
      }
    }
    if (timeSpec === "off" || timeSpec === "closed") {
      for (const d of days) byDay.set(d, []);
      continue;
    }
    const ranges: [string, string][] = [];
    for (const t of timeSpec.split(",")) {
      const tm = t.trim().match(/^(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})$/);
      if (!tm) return null;
      const open = `${tm[1].padStart(2, "0")}:${tm[2]}`;
      let close = `${tm[3].padStart(2, "0")}:${tm[4]}`;
      if (close === "24:00") close = "00:00";
      if (Number(tm[1]) > 23 || Number(tm[3]) > 24) return null;
      ranges.push([open, close]);
    }
    if (!ranges.length) return null;
    // Later rules override earlier ones for the same day (OSM semantics).
    for (const d of days) byDay.set(d, ranges.map(([open, close]) => ({ day: d as HoursRange["day"], open, close })));
  }
  if (!byDay.size) return null;
  return [...byDay.values()].flat().sort((a, b) => a.day - b.day || a.open.localeCompare(b.open));
}
