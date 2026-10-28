import type { HoursRange } from "./schema";

// Open-now logic in America/New_York (SPEC §4.1, §10). close < open means the range runs past midnight.

export const NY_TZ = "America/New_York";

/** Day-of-week (0=Sun) and minutes since midnight for an instant, in NY local time. DST-safe via Intl. */
export function nyClock(at: Date = new Date()): { day: number; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: NY_TZ,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(at);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
  return { day, minutes: Number(get("hour")) * 60 + Number(get("minute")) };
}

/** NY calendar date (YYYY-MM-DD) for an instant. Mirrors the Postgres trigger `(now() at time zone 'America/New_York')::date`. */
export function nyDate(at: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: NY_TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(at);
}

export function toMin(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function covers(r: HoursRange, day: number, minutes: number): boolean {
  const open = toMin(r.open);
  const close = toMin(r.close);
  if (close > open) return r.day === day && minutes >= open && minutes < close;
  if (close === open) return r.day === day; // 24h (e.g. 00:00–00:00)
  // Overnight: open on r.day until midnight, then on the next day until close.
  if (r.day === day && minutes >= open) return true;
  return (r.day + 1) % 7 === day && minutes < close;
}

/** null = hours unknown. */
export function isOpenNow(hours: HoursRange[] | "unknown", at: Date = new Date()): boolean | null {
  if (hours === "unknown") return null;
  const { day, minutes } = nyClock(at);
  return hours.some((r) => covers(r, day, minutes));
}

/** Ranges for a given day (0=Sun), sorted by open time. */
export function rangesForDay(hours: HoursRange[], day: number): HoursRange[] {
  return hours.filter((r) => r.day === day).sort((a, b) => toMin(a.open) - toMin(b.open));
}

/** Format "HH:MM" for display per locale: en "7am", "7:30pm"; zh "7:00", "19:30". */
export function formatTime(hhmm: string, locale: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  if (locale.startsWith("zh")) return `${h % 24}:${String(m).padStart(2, "0")}`;
  const hh = h % 24;
  const suffix = hh < 12 ? "am" : "pm";
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  return m ? `${h12}:${String(m).padStart(2, "0")}${suffix}` : `${h12}${suffix}`;
}

/** Offset (minutes) of America/New_York from UTC at an instant: -240 in EDT, -300 in EST. */
function nyOffsetMin(at: Date): number {
  const p = new Intl.DateTimeFormat("en-US", { timeZone: NY_TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(at);
  const g = (t: string) => Number(p.find((x) => x.type === t)?.value);
  const asUtc = Date.UTC(g("year"), g("month") - 1, g("day"), g("hour"), g("minute"));
  return Math.round((asUtc - at.getTime()) / 60000);
}

/** "2026-11-05" + "09:30" as New York wall-clock time → ISO instant (DST-safe). */
export function nyLocalToISO(date: string, time: string): string {
  const [y, mo, d] = date.split("-").map(Number);
  const [h, mi] = time.split(":").map(Number);
  const naive = Date.UTC(y, mo - 1, d, h, mi);
  let guess = naive - nyOffsetMin(new Date(naive)) * 60000;
  guess = naive - nyOffsetMin(new Date(guess)) * 60000; // second pass settles DST edges
  return new Date(guess).toISOString();
}

/** Locale-aware NY date+time label for sessions. */
export function formatSessionTime(startIso: string, endIso: string, locale: string): string {
  const loc = locale === "zh" ? "zh-CN" : "en-US";
  const day = new Intl.DateTimeFormat(loc, { timeZone: NY_TZ, weekday: "short", month: "short", day: "numeric" }).format(new Date(startIso));
  const t = (iso: string) => new Intl.DateTimeFormat(loc, { timeZone: NY_TZ, hour: "numeric", minute: "2-digit" }).format(new Date(iso));
  return `${day} · ${t(startIso)}–${t(endIso)}`;
}
