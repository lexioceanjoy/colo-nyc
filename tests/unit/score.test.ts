import { describe, expect, it } from "vitest";
import { computeScore, SCORE_WEIGHTS, timeLimitFactor } from "@/lib/score";
import { makeSpot, attrFixture as a } from "../fixtures/spot";

describe("computeScore", () => {
  it("weights sum to 1", () => {
    expect(Object.values(SCORE_WEIGHTS).reduce((x, y) => x + y, 0)).toBeCloseTo(1);
  });

  it("gives 10 for the best possible known values, high confidence", () => {
    const s = computeScore(makeSpot());
    expect(s.score).toBe(10);
    expect(s.confidence).toBe("high");
    expect(s.unknownCount).toBe(0);
  });

  it("counts unknowns as the neutral midpoint and caps confidence", () => {
    const one = computeScore(makeSpot({ work: { wifi: a("unknown") } }));
    expect(one.score).toBe(8.8); // 10 - 2.5 * 0.5 = 8.75, shown to one decimal
    expect(one.confidence).toBe("medium");
    const two = computeScore(makeSpot({ work: { wifi: a("unknown"), noise: a("unknown") } }));
    expect(two.confidence).toBe("low");
  });

  it("always returns a breakdown that sums to the score", () => {
    const s = computeScore(makeSpot({ work: { wifi: a("weak"), laptopPolicy: a("weekdays_only"), timeLimitMin: a(90) } }));
    expect(s.lines).toHaveLength(6);
    const sum = s.lines.reduce((x, l) => x + l.factor * l.weight * 10, 0);
    expect(s.score).toBeCloseTo(Math.round(sum * 10) / 10);
  });

  it("low-confidence attributes pull the badge down", () => {
    const s = computeScore(
      makeSpot({ work: { wifi: a("strong", "low"), outlets: a("many", "low"), seating: a("plenty", "low") } }),
    );
    expect(s.confidence).not.toBe("high");
  });

  it("maps time limits", () => {
    expect(timeLimitFactor(null)).toBe(1);
    expect(timeLimitFactor(240)).toBeGreaterThan(timeLimitFactor(60));
    expect(timeLimitFactor(30)).toBeGreaterThan(0);
  });
});
