import type { Spot } from "./schema";

/**
 * Spot-shaped record for the home list payload: only what cards, filters and the score use.
 * Text fields the list never shows (blurbs, gotchas, sources, notes, address) are emptied, which cut the home HTML a lot.
 * Detail pages get the full record.
 */
export type ClientSpot = Spot;

const EMPTY = { en: "", zh: "" };

export function slimSpot(s: Spot): ClientSpot {
  const work = Object.fromEntries(
    Object.entries(s.work).flatMap(([k, v]) =>
      v && typeof v === "object" && "sources" in v ? [[k, { value: v.value, confidence: v.confidence, sources: [], checkedAt: "" }]] : [],
    ),
  ) as unknown as Spot["work"];
  return {
    slug: s.slug,
    name: s.name,
    googlePlaceId: null,
    address: "",
    hours: { value: s.hours.value, confidence: s.hours.confidence, sources: [], checkedAt: "" },
    category: s.category,
    borough: s.borough,
    neighborhood: s.neighborhood,
    free: s.free,
    work,
    blurb: EMPTY,
    gotchas: { en: [], zh: [] },
    bestFor: [],
    status: s.status,
    addedAt: "",
    updatedAt: "",
    ...(s.closed ? { closed: true } : {}),
  };
}
