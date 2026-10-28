import { describe, expect, it } from "vitest";
import { isOpenNow, nyClock, nyDate, formatTime } from "@/lib/hours";
import type { HoursRange } from "@/lib/schema";

// Helpers: instants given in UTC, asserted in NY time.
const at = (iso: string) => new Date(iso);

describe("nyClock / nyDate", () => {
  it("handles EDT (UTC-4)", () => {
    // 2026-07-01 03:30Z = 2026-06-30 23:30 NY (Tuesday)
    expect(nyClock(at("2026-07-01T03:30:00Z"))).toEqual({ day: 2, minutes: 23 * 60 + 30 });
    expect(nyDate(at("2026-07-01T03:30:00Z"))).toBe("2026-06-30");
  });
  it("handles EST (UTC-5)", () => {
    // 2026-12-01 04:30Z = 2026-11-30 23:30 NY
    expect(nyDate(at("2026-12-01T04:30:00Z"))).toBe("2026-11-30");
    expect(nyDate(at("2026-12-01T05:00:00Z"))).toBe("2026-12-01");
  });
  it("NY midnight boundary for check-ins", () => {
    expect(nyDate(at("2026-10-28T03:59:59Z"))).toBe("2026-10-27");
    expect(nyDate(at("2026-10-28T04:00:00Z"))).toBe("2026-10-28");
  });
  it("DST spring-forward day (2026-03-08)", () => {
    // 06:59Z = 01:59 EST; 07:00Z = 03:00 EDT
    expect(nyClock(at("2026-03-08T06:59:00Z")).minutes).toBe(1 * 60 + 59);
    expect(nyClock(at("2026-03-08T07:00:00Z")).minutes).toBe(3 * 60);
  });
  it("DST fall-back day (2026-11-01)", () => {
    // 05:30Z = 01:30 EDT; 06:30Z = 01:30 EST
    expect(nyClock(at("2026-11-01T05:30:00Z")).minutes).toBe(90);
    expect(nyClock(at("2026-11-01T06:30:00Z")).minutes).toBe(90);
  });
});

describe("isOpenNow", () => {
  const weekday: HoursRange[] = [{ day: 3, open: "08:00", close: "18:00" }]; // Wednesday
  it("returns null for unknown hours", () => {
    expect(isOpenNow("unknown")).toBeNull();
  });
  it("respects open/close in NY time (EDT)", () => {
    // Wed 2026-10-28 08:00 NY = 12:00Z
    expect(isOpenNow(weekday, at("2026-10-28T12:00:00Z"))).toBe(true);
    expect(isOpenNow(weekday, at("2026-10-28T11:59:00Z"))).toBe(false);
    expect(isOpenNow(weekday, at("2026-10-28T22:00:00Z"))).toBe(false); // 18:00 exactly → closed
  });
  it("respects NY time after DST ends (EST)", () => {
    // Wed 2026-11-04 08:00 NY = 13:00Z
    expect(isOpenNow(weekday, at("2026-11-04T12:30:00Z"))).toBe(false);
    expect(isOpenNow(weekday, at("2026-11-04T13:00:00Z"))).toBe(true);
  });
  it("handles ranges past midnight", () => {
    const late: HoursRange[] = [{ day: 5, open: "18:00", close: "02:00" }]; // Fri 6pm → Sat 2am
    expect(isOpenNow(late, at("2026-10-31T05:30:00Z"))).toBe(true); // Sat 01:30 NY
    expect(isOpenNow(late, at("2026-10-31T06:30:00Z"))).toBe(false); // Sat 02:30 NY
    expect(isOpenNow(late, at("2026-10-30T23:00:00Z"))).toBe(true); // Fri 19:00 NY
  });
  it("wraps Saturday night into Sunday", () => {
    const sat: HoursRange[] = [{ day: 6, open: "20:00", close: "01:00" }];
    expect(isOpenNow(sat, at("2026-11-01T04:30:00Z"))).toBe(true); // Sun 00:30 EDT
  });
  it("treats 00:00–00:00 as 24h", () => {
    expect(isOpenNow([{ day: 3, open: "00:00", close: "00:00" }], at("2026-10-28T07:00:00Z"))).toBe(true);
  });
});

describe("formatTime", () => {
  it("formats per locale", () => {
    expect(formatTime("07:00", "en")).toBe("7am");
    expect(formatTime("19:30", "en")).toBe("7:30pm");
    expect(formatTime("00:00", "en")).toBe("12am");
    expect(formatTime("19:30", "zh")).toBe("19:30");
  });
});

describe("nyLocalToISO", () => {
  it("converts EDT and EST wall-clock times", async () => {
    const { nyLocalToISO } = await import("@/lib/hours");
    expect(nyLocalToISO("2026-10-28", "09:30")).toBe("2026-10-28T13:30:00.000Z");
    expect(nyLocalToISO("2026-11-05", "09:30")).toBe("2026-11-05T14:30:00.000Z");
  });
  it("handles the DST switch days", async () => {
    const { nyLocalToISO } = await import("@/lib/hours");
    expect(nyLocalToISO("2026-11-01", "12:00")).toBe("2026-11-01T17:00:00.000Z"); // after fall-back (EST)
    expect(nyLocalToISO("2026-03-08", "12:00")).toBe("2026-03-08T16:00:00.000Z"); // after spring-forward (EDT)
  });
});
