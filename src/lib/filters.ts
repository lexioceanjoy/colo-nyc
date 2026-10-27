import { CATEGORIES, BOROUGHS, type Category, type Borough, type Spot } from "./schema";
import { isOpenNow } from "./hours";
import { computeScore } from "./score";
import { NEIGHBORHOODS, type NeighborhoodKey } from "@/data/neighborhoods";

// Filter state lives in the URL query so links are shareable (SPEC §6.2).

export const FLAG_FILTERS = [
  "open",
  "free",
  "wifi",
  "outlets",
  "quiet",
  "calls",
  "group",
  "weekend",
  "nolimit",
  "today",
  "session",
] as const;
export type FlagFilter = (typeof FLAG_FILTERS)[number];
export const SORTS = ["score", "distance", "people"] as const;
export type Sort = (typeof SORTS)[number];

export type FilterState = {
  flags: FlagFilter[];
  cat: Category[];
  boro: Borough | null;
  hood: NeighborhoodKey | null;
  sort: Sort;
};

export const EMPTY_FILTERS: FilterState = { flags: [], cat: [], boro: null, hood: null, sort: "score" };

type QueryLike = URLSearchParams | Record<string, string | string[] | undefined>;

function read(q: QueryLike, key: string): string | undefined {
  if (q instanceof URLSearchParams) return q.get(key) ?? undefined;
  const v = q[key];
  return Array.isArray(v) ? v[0] : v;
}

function list<T extends string>(raw: string | undefined, allowed: readonly T[]): T[] {
  if (!raw) return [];
  const seen = new Set<T>();
  for (const part of raw.split(",")) if ((allowed as readonly string[]).includes(part)) seen.add(part as T);
  return allowed.filter((a) => seen.has(a)); // canonical order
}

export function parseFilters(q: QueryLike): FilterState {
  const boro = read(q, "boro");
  const hood = read(q, "hood");
  const sort = read(q, "sort");
  return {
    flags: list(read(q, "f"), FLAG_FILTERS),
    cat: list(read(q, "cat"), CATEGORIES),
    boro: (BOROUGHS as readonly string[]).includes(boro ?? "") ? (boro as Borough) : null,
    hood: hood && hood in NEIGHBORHOODS ? (hood as NeighborhoodKey) : null,
    sort: (SORTS as readonly string[]).includes(sort ?? "") ? (sort as Sort) : "score",
  };
}

export function serializeFilters(s: FilterState): string {
  const p = new URLSearchParams();
  if (s.flags.length) p.set("f", list(s.flags.join(","), FLAG_FILTERS).join(","));
  if (s.cat.length) p.set("cat", list(s.cat.join(","), CATEGORIES).join(","));
  if (s.boro) p.set("boro", s.boro);
  if (s.hood) p.set("hood", s.hood);
  if (s.sort !== "score") p.set("sort", s.sort);
  return p.toString().replace(/%2C/g, ",");
}

export function activeFilterCount(s: FilterState): number {
  return s.flags.length + s.cat.length + (s.boro ? 1 : 0) + (s.hood ? 1 : 0);
}

export type SocialSnapshot = { todayCounts: Record<string, number>; sessionSlugs: Set<string> };

const known = <T,>(a: { value: T | "unknown" }) => (a.value === "unknown" ? undefined : a.value);

export function matchesFlag(spot: Spot, flag: FlagFilter, social?: SocialSnapshot, at?: Date): boolean {
  const w = spot.work;
  switch (flag) {
    case "open":
      return isOpenNow(spot.hours.value, at) === true;
    case "free":
      return spot.free;
    case "wifi":
      return known(w.wifi) === "strong";
    case "outlets":
      return known(w.outlets) === "many";
    case "quiet":
      return known(w.noise) === "quiet";
    case "calls":
      return known(w.callsOk) === true;
    case "group": {
      const g = known(w.groupCapacity);
      return g === "4-6" || g === "7+";
    }
    case "weekend": {
      const p = known(w.laptopPolicy);
      return p === "welcome" || p === "restricted_areas";
    }
    case "nolimit":
      return known(w.timeLimitMin) === null;
    case "today":
      return (social?.todayCounts[spot.slug] ?? 0) > 0;
    case "session":
      return social?.sessionSlugs.has(spot.slug) ?? false;
  }
}

export function applyFilters(
  spots: Spot[],
  s: FilterState,
  opts: { social?: SocialSnapshot; at?: Date; distanceKm?: (spot: Spot) => number | undefined } = {},
): Spot[] {
  const out = spots.filter(
    (spot) =>
      !spot.closed &&
      (!s.cat.length || s.cat.includes(spot.category)) &&
      (!s.boro || spot.borough === s.boro) &&
      (!s.hood || spot.neighborhood === s.hood) &&
      s.flags.every((f) => matchesFlag(spot, f, opts.social, opts.at)),
  );
  const byScore = (a: Spot, b: Spot) => computeScore(b).score - computeScore(a).score || a.name.localeCompare(b.name);
  if (s.sort === "people" && opts.social) {
    const c = opts.social.todayCounts;
    return out.sort((a, b) => (c[b.slug] ?? 0) - (c[a.slug] ?? 0) || byScore(a, b));
  }
  if (s.sort === "distance" && opts.distanceKm) {
    const d = opts.distanceKm;
    return out.sort((a, b) => (d(a) ?? Infinity) - (d(b) ?? Infinity) || byScore(a, b));
  }
  return out.sort(byScore);
}
