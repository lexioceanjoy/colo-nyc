import { describe, expect, it } from "vitest";
import { parseOsmHours } from "../../scripts/lib/osm-hours";

describe("parseOsmHours", () => {
  it("parses day ranges and lists", () => {
    const r = parseOsmHours("Mo-Fr 07:00-18:00; Sa,Su 08:00-17:00")!;
    expect(r.filter((x) => x.day === 1)).toEqual([{ day: 1, open: "07:00", close: "18:00" }]);
    expect(r.filter((x) => x.day === 0)).toEqual([{ day: 0, open: "08:00", close: "17:00" }]);
    expect(r).toHaveLength(7);
  });
  it("handles 24/7, split shifts, off days and 24:00", () => {
    expect(parseOsmHours("24/7")).toHaveLength(7);
    const r = parseOsmHours("Mo-Fr 08:00-12:00,13:00-17:00; Su off")!;
    expect(r.filter((x) => x.day === 2)).toHaveLength(2);
    expect(r.some((x) => x.day === 0)).toBe(false);
    expect(parseOsmHours("Mo-Su 18:00-24:00")![0].close).toBe("00:00");
  });
  it("wraps day ranges across the week", () => {
    expect(parseOsmHours("Fr-Mo 10:00-16:00")!.map((x) => x.day)).toEqual([0, 1, 5, 6]);
  });
  it("lets later rules override earlier ones", () => {
    const r = parseOsmHours("Mo-Su 07:00-19:00; Su 09:00-15:00")!;
    expect(r.filter((x) => x.day === 0)).toEqual([{ day: 0, open: "09:00", close: "15:00" }]);
  });
  it("refuses anything ambiguous", () => {
    expect(parseOsmHours("Mo-Fr 08:00-17:00; PH off")).toHaveLength(5);
    for (const s of ["Mo-Fr 08:00-17:00; PH 10:00-14:00", "Jun-Aug Mo-Fr 09:00-17:00", "sunrise-sunset", 'Mo-Fr 09:00-17:00 "by appointment"', "Mo-Fr 09:00+", "garbage"])
      expect(parseOsmHours(s)).toBeNull();
  });
});
