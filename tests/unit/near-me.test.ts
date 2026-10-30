import { describe, expect, it } from "vitest";
import { formatWalk, isAt, statusFromError, walkMinutes } from "@/lib/near-me";

describe("walking time", () => {
  it("uses ~3 mph with a 20% street-grid factor, minimum 1 minute", () => {
    expect(walkMinutes(0.4)).toBe(6); // 0.48 km at 0.08 km/min
    expect(walkMinutes(1.6)).toBe(24);
    expect(walkMinutes(0.01)).toBe(1);
  });
  it("formats per locale", () => {
    expect(formatWalk(0.4, "en")).toBe("0.2 mi · 6 min walk");
    expect(formatWalk(0.05, "en")).toBe("<0.1 mi · 1 min walk");
    expect(formatWalk(0.4, "zh")).toBe("约6分钟步行");
  });
});

describe("check-in nudge", () => {
  const spot = { lat: 40.7231, lng: -73.9985 };
  it("is within ~75 m", () => {
    expect(isAt({ lat: 40.7235, lng: -73.9985 }, spot)).toBe(true); // ~45 m
    expect(isAt({ lat: 40.7245, lng: -73.9985 }, spot)).toBe(false); // ~155 m
  });
});

describe("geolocation errors", () => {
  it("separates denial from other failures", () => {
    expect(statusFromError(1)).toBe("denied");
    expect(statusFromError(2)).toBe("error");
    expect(statusFromError(3)).toBe("error");
  });
});
