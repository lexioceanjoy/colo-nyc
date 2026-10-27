import { z } from "zod";
import { NEIGHBORHOOD_KEYS } from "@/data/neighborhoods";

// Source of truth for the curated spot shape (SPEC §4.1).

export const confidence = z.enum(["high", "medium", "low"]);
export type Confidence = z.infer<typeof confidence>;

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "ISO date YYYY-MM-DD");
const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$|^24:00$/, "HH:MM 24h");
const sourceRef = z.union([z.literal("lexi"), z.url()]);

export const bilingual = z.object({ en: z.string().min(1), zh: z.string().min(1) });

/** Attr<T>: value may be "unknown". Known values need ≥1 source (enforced in validate). */
export function attr<T extends z.ZodType>(value: T) {
  return z.object({
    value: z.union([value, z.literal("unknown")]),
    confidence,
    note: bilingual.optional(),
    sources: z.array(sourceRef),
    checkedAt: isoDate,
  });
}

export const hoursRange = z.object({
  day: z.literal([0, 1, 2, 3, 4, 5, 6]),
  open: hhmm,
  close: hhmm,
});
export type HoursRange = { day: 0 | 1 | 2 | 3 | 4 | 5 | 6; open: string; close: string };

export const CATEGORIES = ["cafe", "library", "pops", "hotel_lobby", "museum", "other_public"] as const;
export const BOROUGHS = ["manhattan", "brooklyn", "queens"] as const;
export const BEST_FOR = ["deep_focus", "calls", "group", "meetings", "long_day", "quick_session"] as const;

export const WIFI = ["strong", "ok", "weak", "none"] as const;
export const OUTLETS = ["many", "some", "few", "none"] as const;
export const SEATING = ["plenty", "moderate", "limited"] as const;
export const NOISE = ["quiet", "moderate", "lively"] as const;
export const LAPTOP_POLICY = ["welcome", "weekdays_only", "restricted_areas", "discouraged"] as const;
export const GROUP_CAPACITY = ["solo", "2-3", "4-6", "7+"] as const;
export const RESTROOM = ["customers", "public", "none"] as const;

export const workSchema = z.object({
  wifi: attr(z.enum(WIFI)),
  outlets: attr(z.enum(OUTLETS)),
  seating: attr(z.enum(SEATING)),
  noise: attr(z.enum(NOISE)),
  laptopPolicy: attr(z.enum(LAPTOP_POLICY)),
  timeLimitMin: attr(z.number().int().positive().nullable()),
  callsOk: attr(z.boolean()),
  groupCapacity: attr(z.enum(GROUP_CAPACITY)),
  bookableSpace: attr(z.boolean()),
  restroom: attr(z.enum(RESTROOM)),
  busyTimes: bilingual.optional(),
});

export const spotSchema = z
  .object({
    slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
    name: z.string().min(1),
    nameZh: z.string().optional(),
    googlePlaceId: z.string().min(1).nullable(),
    fallbackLocation: z
      .object({ lat: z.number().min(40.4).max(41), lng: z.number().min(-74.3).max(-73.6), source: z.url() })
      .optional(),
    address: z.string().min(1),
    website: z.url().optional(),
    hours: attr(z.array(hoursRange)),
    category: z.enum(CATEGORIES),
    borough: z.enum(BOROUGHS),
    neighborhood: z.enum(NEIGHBORHOOD_KEYS),
    free: z.boolean(),
    work: workSchema,
    blurb: bilingual.refine((b) => b.en.length <= 220, "blurb.en must be ≤ 220 chars"),
    gotchas: z.object({ en: z.array(z.string().min(1)), zh: z.array(z.string().min(1)) }),
    bestFor: z.array(z.enum(BEST_FOR)),
    status: z.enum(["ai_researched", "verified"]),
    verifiedBy: z.string().optional(),
    verifiedAt: isoDate.optional(),
    /** Our own closure flag, derived from Places businessStatus (SPEC §4.2). Raw Google value is never stored. */
    closed: z.boolean().optional(),
    addedAt: isoDate,
    updatedAt: isoDate,
  })
  .strict();

export type Spot = z.infer<typeof spotSchema>;
export type Category = Spot["category"];
export type Borough = Spot["borough"];
export type BestFor = (typeof BEST_FOR)[number];
export type AttrValue<T> = { value: T | "unknown"; confidence: Confidence; note?: { en: string; zh: string }; sources: string[]; checkedAt: string };

export const spotsSchema = z.array(spotSchema);

/** The 11 core attributes used for the M1 confidence metric (10 work + hours). */
export const CORE_ATTRS = [
  "wifi",
  "outlets",
  "seating",
  "noise",
  "laptopPolicy",
  "timeLimitMin",
  "callsOk",
  "groupCapacity",
  "bookableSpace",
  "restroom",
] as const;
export type WorkAttrKey = (typeof CORE_ATTRS)[number];
