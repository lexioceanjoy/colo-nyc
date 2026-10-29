import { describe, expect, it } from "vitest";
import { applyCrowd, crowdConfidence, crowdWins, hoursFromVote, type CrowdRow } from "@/lib/crowd-rules";
import { coreKnown } from "@/lib/core";
import { makeSpot, attrFixture as a } from "../fixtures/spot";

const row = (over: Partial<CrowdRow>): CrowdRow => ({
  spot_slug: "test-spot",
  field: "noise",
  value: "quiet",
  reports: 1,
  total: 1,
  disagree: false,
  last_at: "2026-10-29T15:00:00Z",
  ...over,
});

describe("crowd confidence", () => {
  it("1 → low, 2 → medium, 3+ → high", () => {
    expect([1, 2, 3, 7].map(crowdConfidence)).toEqual(["low", "medium", "high", "high"]);
  });
});

describe("crowdWins", () => {
  it("one report fills an unknown detail", () => {
    expect(crowdWins(makeSpot({ work: { noise: a("unknown") } }), row({}))).toBe(true);
  });
  it("one report replaces a low-confidence AI value", () => {
    expect(crowdWins(makeSpot({ work: { noise: a("lively", "low") } }), row({}))).toBe(true);
  });
  it("medium/high values need 2+ agreeing reports to be overwritten", () => {
    const s = makeSpot({ work: { noise: a("lively", "medium") } });
    expect(crowdWins(s, row({ reports: 1 }))).toBe(false);
    expect(crowdWins(s, row({ reports: 2 }))).toBe(true);
    expect(crowdWins(makeSpot({ work: { noise: a("lively", "high") } }), row({ reports: 1 }))).toBe(false);
  });
  it("a report that agrees with research changes nothing", () => {
    expect(crowdWins(makeSpot({ work: { noise: a("quiet", "low") } }), row({}))).toBe(false);
  });
});

describe("applyCrowd", () => {
  it("fills an unknown detail with low confidence and a 'Reported by 1 visitor' note, and it counts toward 3-of-5", () => {
    const s = makeSpot({ work: { noise: a("unknown"), outlets: a("unknown"), wifi: a("unknown") } });
    expect(coreKnown(s)).toBe(2);
    const { spot, crowd } = applyCrowd(s, [row({})]);
    expect(spot.work.noise).toMatchObject({ value: "quiet", confidence: "low", sources: ["community"] });
    expect(spot.work.noise.note?.en).toBe("Reported by 1 visitor.");
    expect(spot.work.noise.note?.zh).toBe("1位访客反馈。");
    expect(crowd.noise).toMatchObject({ reports: 1, disagree: false, replaced: false });
    expect(coreKnown(spot)).toBe(3);
    expect(s.work.noise.value).toBe("unknown"); // input not mutated
  });
  it("raises confidence with more agreeing reports", () => {
    const s = makeSpot({ work: { noise: a("unknown") } });
    expect(applyCrowd(s, [row({ reports: 2, total: 2 })]).spot.work.noise.confidence).toBe("medium");
    expect(applyCrowd(s, [row({ reports: 3, total: 3 })]).spot.work.noise.confidence).toBe("high");
  });
  it("labels ties as disagreement", () => {
    const { spot, crowd } = applyCrowd(makeSpot({ work: { noise: a("unknown") } }), [row({ reports: 1, total: 2, disagree: true })]);
    expect(spot.work.noise.note?.en).toBe("Visitors disagree; showing the most recent report.");
    expect(spot.work.noise.note?.zh).toBe("访客意见不一，显示最新的反馈。");
    expect(crowd.noise?.disagree).toBe(true);
  });
  it("turns hours reports into weekly ranges", () => {
    const { spot } = applyCrowd(makeSpot({ hours: a("unknown") }), [row({ field: "hours", value: "07-18|closed" })]);
    expect(spot.hours.value).toHaveLength(5);
    expect(hoursFromVote("08-24|09-17").find((h) => h.day === 1)).toEqual({ day: 1, open: "08:00", close: "00:00" });
  });
  it("ignores other spots' rows", () => {
    expect(applyCrowd(makeSpot({ work: { noise: a("unknown") } }), [row({ spot_slug: "elsewhere" })]).crowd).toEqual({});
  });
});
