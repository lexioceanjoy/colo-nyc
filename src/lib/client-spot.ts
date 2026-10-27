import type { Spot } from "./schema";

/** Spot without sources/notes, for the home list payload. Detail pages get the full record. */
export type ClientSpot = Spot;

export function slimSpot(s: Spot): ClientSpot {
  const work = Object.fromEntries(
    Object.entries(s.work).map(([k, v]) =>
      v && typeof v === "object" && "sources" in v ? [k, { ...v, sources: [], note: undefined }] : [k, v],
    ),
  ) as Spot["work"];
  return { ...s, work, hours: { ...s.hours, sources: [], note: undefined } };
}
