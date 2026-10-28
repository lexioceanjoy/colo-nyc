import type { Spot } from "./schema";

/** The 5 core details Lexi tracks for coverage and visibility (2026-10-28). */
export const CORE5 = ["wifi", "outlets", "laptopPolicy", "noise", "hours"] as const;
export type Core5 = (typeof CORE5)[number];
export const MIN_CORE_KNOWN = 3;

export function coreValue(s: Spot, k: Core5) {
  return k === "hours" ? s.hours.value : s.work[k].value;
}

export function coreKnown(s: Spot): number {
  return CORE5.filter((k) => coreValue(s, k) !== "unknown").length;
}

export function coreMissing(s: Spot): Core5[] {
  return CORE5.filter((k) => coreValue(s, k) === "unknown");
}

/** Shown on the site: not closed and at least 3 of the 5 core details known. */
export function isListed(s: Spot): boolean {
  return !s.closed && coreKnown(s) >= MIN_CORE_KNOWN;
}
