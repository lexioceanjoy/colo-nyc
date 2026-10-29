import "server-only";
import { getAllSpots, getVisibleSpots } from "./spots";
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
  return {
    spots: visible.length,
    sources: sources.size,
    knownPct: Math.round((known / cells) * 100),
    verified: visible.filter((s) => s.status === "verified").length,
    free: visible.filter((s) => s.free).length,
  };
}
