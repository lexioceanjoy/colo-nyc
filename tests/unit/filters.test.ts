import { describe, expect, it } from "vitest";
import { parseFilters, serializeFilters, applyFilters, EMPTY_FILTERS, type FilterState } from "@/lib/filters";
import { makeSpot, attrFixture as a } from "../fixtures/spot";

describe("filter URL state", () => {
  it("round-trips", () => {
    const s: FilterState = { flags: ["free", "wifi", "group"], cat: ["cafe", "library"], boro: "brooklyn", hood: "williamsburg", sort: "people" };
    const qs = serializeFilters(s);
    expect(parseFilters(new URLSearchParams(qs))).toEqual(s);
  });
  it("is canonical (order-independent) and drops junk", () => {
    const p = parseFilters(new URLSearchParams("f=group,bogus,free&cat=library,cafe&boro=mars&sort=nope"));
    expect(p).toEqual({ ...EMPTY_FILTERS, flags: ["free", "group"], cat: ["cafe", "library"] });
    expect(serializeFilters(p)).toBe("f=free,group&cat=cafe,library");
  });
  it("serializes empty state to empty string", () => {
    expect(serializeFilters(EMPTY_FILTERS)).toBe("");
  });
  it("accepts Next searchParams records", () => {
    expect(parseFilters({ f: ["quiet"], cat: undefined }).flags).toEqual(["quiet"]);
  });
});

describe("applyFilters", () => {
  const cafe = makeSpot({ slug: "cafe", free: false });
  const lib = makeSpot({ slug: "lib", category: "library", free: true, work: { groupCapacity: a("solo"), wifi: a("ok") } });
  const closed = makeSpot({ slug: "gone", closed: true });
  const unknownWifi = makeSpot({ slug: "mystery", work: { wifi: a("unknown") } });

  it("hides closed spots", () => {
    expect(applyFilters([cafe, closed], EMPTY_FILTERS).map((s) => s.slug)).toEqual(["cafe"]);
  });
  it("filters by flags and category", () => {
    expect(applyFilters([cafe, lib], { ...EMPTY_FILTERS, flags: ["free"] }).map((s) => s.slug)).toEqual(["lib"]);
    expect(applyFilters([cafe, lib], { ...EMPTY_FILTERS, flags: ["group"] }).map((s) => s.slug)).toEqual(["cafe"]);
    expect(applyFilters([cafe, lib], { ...EMPTY_FILTERS, cat: ["library"] }).map((s) => s.slug)).toEqual(["lib"]);
  });
  it("never matches unknown values", () => {
    expect(applyFilters([unknownWifi], { ...EMPTY_FILTERS, flags: ["wifi"] })).toEqual([]);
  });
  it("sorts by people today when social data is present", () => {
    const social = { todayCounts: { lib: 3 }, sessionSlugs: new Set<string>() };
    expect(applyFilters([cafe, lib], { ...EMPTY_FILTERS, sort: "people" }, { social }).map((s) => s.slug)).toEqual(["lib", "cafe"]);
    expect(applyFilters([cafe, lib], { ...EMPTY_FILTERS, flags: ["today"] }, { social }).map((s) => s.slug)).toEqual(["lib"]);
  });
});
