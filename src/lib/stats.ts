import "server-only";
import { getAllSpots, getVisibleSpots, getLiveSpots } from "./spots";
import { CORE5, coreValue } from "./core";
import { CORE_ATTRS } from "./schema";

/** Numbers for the About page, computed from the data, never typed by hand. */
export async function getStats() {
  const visible = await getVisibleSpots();
  const sources = new Set<string>();
  let cells = 0;
  let known = 0;
  for (const s of getAllSpots()) {
    for (const a of [s.hours, ...CORE_ATTRS.map((k) => s.work[k])]) {
      for (const u of a.sources) if (u !== "lexi") sources.add(u);
    }
  }
  for (const s of visible) {
    for (const a of [s.hours, ...CORE_ATTRS.map((k) => s.work[k])]) {
      cells++;
      if (a.value !== "unknown") known++;
    }
  }
  // Coverage of the 5 core details across every open spot (live: includes visitor reports).
  const open = (await getLiveSpots()).filter((s) => !s.closed);
  const coverage = Object.fromEntries(
    CORE5.map((k) => [k, Math.round((open.filter((s) => coreValue(s, k) !== "unknown").length / Math.max(1, open.length)) * 100)]),
  ) as Record<(typeof CORE5)[number], number>;
  const crowdDetails = open.reduce((n, s) => n + Object.keys((s as { crowd?: object }).crowd ?? {}).length, 0);
  return {
    spots: visible.length,
    hidden: open.length - visible.length,
    coverage,
    crowdDetails,
    sources: sources.size,
    knownPct: Math.round((known / cells) * 100),
    verified: visible.filter((s) => s.status === "verified").length,
    free: visible.filter((s) => s.free).length,
  };
}
