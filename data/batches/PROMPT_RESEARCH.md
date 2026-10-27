# Research batch instructions (Colo NYC, SPEC §5.2)

You research ~10 NYC spots and write their full records. Today is 2026-10-27. Accuracy beats completeness:
**"unknown" with low confidence is better than a guess. Never invent a fact. Never fill a gap to look complete.**

## Steps per spot
1. Confirm it is **still open** (search "<name> closed", "<name> permanently closed", check the venue site/Instagram snippet). If permanently closed, or it turns out to ban laptops entirely, or it is paid coworking: DO NOT write a record; list it in the notes file with reason + source URL.
2. Find the venue's own site (or Instagram/official page) for **address** and **hours**, and any laptop policy (weekend laptop bans, laptop-free zones, time limits are common; check menus/FAQ/"house rules"/signage mentioned in reviews).
3. Search for work-specific details: wifi, outlets, seating, noise, calls, group seating, restrooms, busy times, time limits. Good sources: the candidate's listed source_urls (re-read them), Half Half Travel, WFHishNYC, The Infatuation, Time Out, Eater, NYU News, West Side Rag, Brooklyn Magazine, laptopfriendly.co, freakingnomads, library system pages (nypl.org, bklynlibrary.org, queenslibrary.org), apops.mas.org / NYC Open Data for POPS, Reddit snippets.
4. Instagram/Reddit/Yelp/nypl.org often block fetching. You may use their **search-result snippets**. Cite only URLs whose content (page or snippet) you actually saw. If you can't read it, don't cite it.
5. **Google Maps is never a source.** Do not copy Google reviews or text. Do not cite google.com URLs.

## Confidence rubric (per attribute)
- `high` = 2+ independent recent (≤18 months, i.e. since ~May 2025) sources agree, or an official policy page (venue site / library system page).
- `medium` = one credible recent source.
- `low` = old (>18 mo) or conflicting sources. If sources disagree, use `low` and explain in `note` (both languages).
- `unknown` value → `confidence: "low"`, `sources: []`.

## Output
Write **`/Users/lexi/projects/colo-nyc/data/batches/batch-NN.json`** (NN = your batch number): a JSON array of Spot objects, exactly this shape (TypeScript notation):

```ts
type Confidence = "high" | "medium" | "low";
type Attr<T> = { value: T | "unknown"; confidence: Confidence; note?: { en: string; zh: string }; sources: string[]; checkedAt: "2026-10-27" };
type Spot = {
  slug: string;              // kebab-case, unique: name + neighborhood for chains, e.g. "devocion-williamsburg", "think-coffee-tribeca"
  name: string;              // official English name
  nameZh?: string;           // ONLY if a common Chinese name exists (e.g., 纽约公共图书馆). Usually omit.
  googlePlaceId: null;       // always null (resolved later by script)
  address: string;           // street address with ZIP if known, from venue site / official / non-Google source
  website?: string;          // venue's own site or Instagram URL (full https URL)
  hours: Attr<{ day: 0|1|2|3|4|5|6; open: "HH:MM"; close: "HH:MM" }[]>; // 0=Sunday; 24h NY time; close < open = past midnight; omit closed days. From venue site/IG. Unknown if you can't find current hours.
  category: "cafe" | "library" | "pops" | "hotel_lobby" | "museum" | "other_public";
  borough: "manhattan" | "brooklyn" | "queens";
  neighborhood: NeighborhoodKey; // MUST be one of the keys listed below
  free: boolean;             // true only if no purchase is expected (libraries, POPS, most lobbies only if sources say so)
  work: {
    wifi: Attr<"strong" | "ok" | "weak" | "none">;
    outlets: Attr<"many" | "some" | "few" | "none">;
    seating: Attr<"plenty" | "moderate" | "limited">;
    noise: Attr<"quiet" | "moderate" | "lively">;
    laptopPolicy: Attr<"welcome" | "weekdays_only" | "restricted_areas" | "discouraged">;
    timeLimitMin: Attr<number | null>;  // null = confirmed no limit; "unknown" if not found
    callsOk: Attr<boolean>;
    groupCapacity: Attr<"solo" | "2-3" | "4-6" | "7+">; // max group that can RELIABLY sit together (communal table for 8 → "7+")
    bookableSpace: Attr<boolean>;       // e.g., library study/meeting rooms bookable by the public
    restroom: Attr<"customers" | "public" | "none">;
    busyTimes?: { en: string; zh: string }; // only if a source says, e.g. "Packed weekends 11–3"
  };
  blurb: { en: string; zh: string };   // en ≤ 220 chars, our own words synthesized from sources (no quoting reviews)
  gotchas: { en: string[]; zh: string[] }; // same count in both; the stuff other lists don't say (weekend laptop bans, time limits, purchase required, no wifi, laptop-free zones, crowded hours, closes early). Can be [].
  bestFor: ("deep_focus" | "calls" | "group" | "meetings" | "long_day" | "quick_session")[];
  status: "ai_researched";
  addedAt: "2026-10-27"; updatedAt: "2026-10-27";
};
```

Every attribute whose value is not "unknown" MUST have ≥1 source URL. Valid neighborhood keys:
fidi, battery_park_city, tribeca, chinatown, two_bridges, hudson_square, seaport, soho, nolita, lower_east_side, east_village, west_village, greenwich_village, noho, union_square, chelsea, flatiron, nomad, gramercy, murray_hill, kips_bay, hudson_yards, hells_kitchen, midtown, midtown_east, upper_west_side, upper_east_side, morningside_heights, harlem, east_harlem, hamilton_heights, washington_heights, inwood, roosevelt_island, williamsburg, greenpoint, bushwick, dumbo, brooklyn_heights, downtown_brooklyn, fort_greene, clinton_hill, prospect_heights, park_slope, crown_heights, bed_stuy, ocean_hill, carroll_gardens, cobble_hill, boerum_hill, gowanus, red_hook, sunset_park, windsor_terrace, flatbush, navy_yard, long_island_city, astoria

## Chinese copy (blurb.zh, gotchas.zh, notes, busyTimes.zh)
Write like a native NYC 小红书 user: natural, concise, practical (插座、网速、安静、适合打电话、周末不让开电脑、要排队、限时). NOT a word-for-word translation. Keep spot names in English. Example:
- en: "Big communal tables, fast Wi-Fi and outlets along the wall. Weekdays are calm; weekends are brunch chaos and laptops are off-limits."
- zh: "长桌很多，网速快，靠墙一排插座。工作日很清静，周末早午餐人超多，而且不让开电脑。"

## Also write
`/Users/lexi/projects/colo-nyc/data/batches/batch-NN-notes.md`: per spot one line: slug · key findings · which attributes are unknown and why; plus a "Dropped" section (name · reason · source URL).

Before finishing, run `cd /Users/lexi/projects/colo-nyc && pnpm exec tsx scripts/check-batch.ts data/batches/batch-NN.json` and fix every error it reports. Reply with a ≤5-line summary (spots written, dropped, % attributes known).
