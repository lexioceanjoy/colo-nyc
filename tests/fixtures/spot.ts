import type { Spot } from "@/lib/schema";

const a = <T,>(value: T | "unknown", confidence: "high" | "medium" | "low" = "high") => ({
  value,
  confidence,
  sources: value === "unknown" ? [] : ["https://example.com/source"],
  checkedAt: "2026-10-27",
});

export function makeSpot(over: Omit<Partial<Spot>, "work"> & { work?: Partial<Spot["work"]> } = {}): Spot {
  const { work, ...rest } = over;
  return {
    slug: "test-spot",
    name: "Test Spot",
    googlePlaceId: null,
    address: "1 Test St, New York, NY 10001",
    hours: a([1, 2, 3, 4, 5].map((day) => ({ day: day as 1, open: "08:00", close: "18:00" }))),
    category: "cafe",
    borough: "manhattan",
    neighborhood: "chelsea",
    free: false,
    work: {
      wifi: a("strong"),
      outlets: a("many"),
      seating: a("plenty"),
      noise: a("quiet"),
      laptopPolicy: a("welcome"),
      timeLimitMin: a(null),
      callsOk: a(true),
      groupCapacity: a("4-6"),
      bookableSpace: a(false),
      restroom: a("customers"),
      ...work,
    },
    blurb: { en: "A test spot.", zh: "测试地点。" },
    gotchas: { en: [], zh: [] },
    bestFor: [],
    status: "ai_researched",
    addedAt: "2026-10-27",
    updatedAt: "2026-10-27",
    ...rest,
  } as Spot;
}

export { a as attrFixture };
