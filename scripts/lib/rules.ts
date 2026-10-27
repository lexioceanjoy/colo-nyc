import { CORE_ATTRS, type Spot } from "../../src/lib/schema";

const HAN = /[一-鿿]/;

/** Content rules beyond the zod schema (SPEC §4.1, §5.3, §5.4). Returns human-readable problems. */
export function spotProblems(s: Spot): string[] {
  const out: string[] = [];
  const attrs: [string, { value: unknown; sources: string[]; note?: { en: string; zh: string } }][] = [
    ["hours", s.hours],
    ...CORE_ATTRS.map((k) => [k, s.work[k]] as [string, (typeof s.work)[typeof k]]),
  ];
  for (const [k, a] of attrs) {
    if (a.value !== "unknown" && a.sources.length === 0) out.push(`${k} is known but has no source`);
    if (a.note && (!a.note.en.trim() || !HAN.test(a.note.zh))) out.push(`${k}.note missing a language`);
    for (const src of a.sources)
      if (/google\.[a-z.]+\/maps|maps\.app\.goo\.gl|goo\.gl\/maps/i.test(src)) out.push(`${k} cites Google Maps (not allowed)`);
  }
  if (s.gotchas.en.length !== s.gotchas.zh.length) out.push(`gotchas en/zh count mismatch (${s.gotchas.en.length}/${s.gotchas.zh.length})`);
  if (!HAN.test(s.blurb.zh)) out.push("blurb.zh has no Chinese text");
  for (const g of s.gotchas.zh) if (!HAN.test(g)) out.push(`gotcha zh has no Chinese text: "${g}"`);
  if (s.work.busyTimes && !HAN.test(s.work.busyTimes.zh)) out.push("busyTimes.zh has no Chinese text");
  if (s.fallbackLocation && s.googlePlaceId) out.push("fallbackLocation is only allowed when googlePlaceId is null");
  if (/google\./i.test(s.fallbackLocation?.source ?? "")) out.push("fallbackLocation must come from a non-Google source");
  if (s.status === "verified" && (!s.verifiedBy || !s.verifiedAt)) out.push("verified spots need verifiedBy and verifiedAt");
  if (s.hours.value !== "unknown") {
    for (const r of s.hours.value) if (r.open === r.close && r.open !== "00:00") out.push(`hours: open == close (${r.open}) on day ${r.day}`);
  }
  return out;
}
