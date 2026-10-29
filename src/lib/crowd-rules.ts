import type { Confidence, HoursRange, Spot } from "./schema";
import { CORE5, coreValue, type Core5 } from "./core";

// Phase 1 rules (docs/NEXT-PHASES.md). Pure so the site, the weekly merge and the tests share one implementation.

/** One row of `crowd_details()`: the winning reported value for a spot detail. */
export type CrowdRow = {
  spot_slug: string;
  field: Core5;
  value: string;
  reports: number; // distinct people who reported the winning value
  total: number; // distinct people who reported anything for this detail
  disagree: boolean; // tie at the top; most recent value won
  last_at: string;
};

/** How a crowd value is shown next to a detail. */
export type CrowdApplied = { reports: number; disagree: boolean; lastAt: string; replaced: boolean };

export function crowdConfidence(reports: number): Confidence {
  return reports >= 3 ? "high" : reports === 2 ? "medium" : "low";
}

/** "07-18|08-17" → Mon–Fri 07:00–18:00, Sat–Sun 08:00–17:00 ("closed" omits those days). */
export function hoursFromVote(v: string): HoursRange[] {
  const [wd, we] = v.split("|");
  const days = (r: string, ds: number[]) =>
    r === "closed" || !r
      ? []
      : ds.map((day) => {
          const [o, c] = r.split("-");
          return { day: day as HoursRange["day"], open: `${o}:00`, close: c === "24" ? "00:00" : `${c}:00` };
        });
  return [...days(wd, [1, 2, 3, 4, 5]), ...days(we, [0, 6])].sort((a, b) => a.day - b.day);
}

/**
 * Should this crowd row win over our researched value?
 * - unknown → any single report fills it;
 * - low-confidence research → a single report replaces it;
 * - medium/high research → only when ≥2 people agree on a different value.
 */
export function crowdWins(spot: Spot, row: CrowdRow): boolean {
  const k = row.field;
  const current = k === "hours" ? spot.hours : spot.work[k];
  if (current.value === "unknown") return row.reports >= 1;
  const same = k === "hours" ? false : String(current.value) === row.value;
  if (same) return false;
  if (current.confidence === "low") return row.reports >= 1;
  return row.reports >= 2;
}

/** Returns a copy of the spot with winning crowd values applied, plus per-detail display info. */
export function applyCrowd(spot: Spot, rows: CrowdRow[]): { spot: Spot; crowd: Partial<Record<Core5, CrowdApplied>> } {
  const mine = rows.filter((r) => r.spot_slug === spot.slug && (CORE5 as readonly string[]).includes(r.field));
  if (!mine.length) return { spot, crowd: {} };
  const out: Spot = structuredClone(spot);
  const crowd: Partial<Record<Core5, CrowdApplied>> = {};
  for (const r of mine) {
    const wasUnknown = coreValue(spot, r.field) === "unknown";
    if (!crowdWins(spot, r)) continue;
    const attr = {
      confidence: crowdConfidence(r.reports),
      sources: ["community"],
      checkedAt: r.last_at.slice(0, 10),
      note: r.disagree
        ? { en: "Visitors disagree; showing the most recent report.", zh: "访客意见不一，显示最新的反馈。" }
        : { en: `Reported by ${r.reports} visitor${r.reports === 1 ? "" : "s"}.`, zh: `${r.reports}位访客反馈。` },
    };
    if (r.field === "hours") out.hours = { ...attr, value: hoursFromVote(r.value) };
    else (out.work[r.field] as unknown) = { ...attr, value: r.value };
    crowd[r.field] = { reports: r.reports, disagree: r.disagree, lastAt: r.last_at, replaced: !wasUnknown };
  }
  return { spot: out, crowd };
}
