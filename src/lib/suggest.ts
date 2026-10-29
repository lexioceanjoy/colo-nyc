// Phase 2: spot suggestions. Pure helpers shared by the server action, intake script and tests.
import { CROWD_VALUES, type Core5Answer } from "./crowd-values";

const STOP = new Set(["the", "a", "an", "and", "of", "nyc", "new", "york", "cafe", "café", "coffee", "co", "shop", "bar", "&"]);

/** "The Lost Draft Café (SoHo)" → "lost draft": for duplicate checks, not display. */
export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\(.*?\)/g, " ")
    .split(/[^a-z0-9]+/)
    .filter((t) => t && !STOP.has(t))
    .join(" ");
}

/** Same normalized name in the same neighborhood (or either side has no neighborhood). */
export function isDuplicate(a: { name: string; neighborhood?: string | null }, b: { name: string; neighborhood?: string | null }): boolean {
  const na = normalizeName(a.name);
  if (!na || na !== normalizeName(b.name)) return false;
  return !a.neighborhood || !b.neighborhood || a.neighborhood === b.neighborhood;
}

/** Keep only well-formed answers for the 5 core details (same values the crowd tables accept). */
export function cleanAnswers(raw: Record<string, unknown>): Core5Answer {
  const out: Core5Answer = {};
  for (const [k, allowed] of Object.entries(CROWD_VALUES)) {
    const v = raw[k];
    if (typeof v === "string" && (allowed as readonly string[]).includes(v)) (out as Record<string, string>)[k] = v;
  }
  const h = raw.hours;
  if (typeof h === "string" && /^(([01][0-9]|2[0-3])-([01][0-9]|2[0-4])|closed)\|(([01][0-9]|2[0-3])-([01][0-9]|2[0-4])|closed)$/.test(h)) out.hours = h;
  return out;
}
