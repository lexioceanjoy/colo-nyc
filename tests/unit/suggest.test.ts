import { describe, expect, it } from "vitest";
import { cleanAnswers, isDuplicate, normalizeName } from "@/lib/suggest";

describe("normalizeName", () => {
  it("drops filler words, accents and parentheticals", () => {
    expect(normalizeName("The Lost Draft Café (SoHo)")).toBe("lost draft");
    expect(normalizeName("Devoción")).toBe("devocion");
    expect(normalizeName("Variety Coffee Roasters")).toBe("variety roasters");
  });
});

describe("isDuplicate", () => {
  it("matches the same place in the same neighborhood", () => {
    expect(isDuplicate({ name: "The Lost Draft", neighborhood: "nolita" }, { name: "Lost Draft Cafe", neighborhood: "nolita" })).toBe(true);
  });
  it("treats chains in different neighborhoods as different spots", () => {
    expect(isDuplicate({ name: "Variety Coffee", neighborhood: "greenpoint" }, { name: "Variety Coffee", neighborhood: "park_slope" })).toBe(false);
  });
  it("is cautious when a neighborhood is missing", () => {
    expect(isDuplicate({ name: "Nook", neighborhood: null }, { name: "Nook", neighborhood: "bushwick" })).toBe(true);
  });
  it("never matches empty names", () => {
    expect(isDuplicate({ name: "The Cafe" }, { name: "Coffee Shop" })).toBe(false);
  });
});

describe("cleanAnswers", () => {
  it("keeps valid values and drops junk", () => {
    expect(cleanAnswers({ wifi: "strong", outlets: "lots", noise: "quiet", hours: "07-18|closed", extra: "x" })).toEqual({ wifi: "strong", noise: "quiet", hours: "07-18|closed" });
    expect(cleanAnswers({ hours: "7-18|x" })).toEqual({});
  });
});
