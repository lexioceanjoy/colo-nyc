/** pnpm data:audit — per-gap audit of what research already tried (from batch/fill notes) → data/gap-audit.md */
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { readSpots, ROOT, today } from "./lib/spots-io";
import { NEIGHBORHOODS } from "../src/data/neighborhoods";

export const CORE5 = ["wifi", "outlets", "laptopPolicy", "noise", "hours"] as const;
const dir = join(ROOT, "data/batches");
const notes = readdirSync(dir)
  .filter((f) => /^(batch|fill)-\d+-notes\.md$/.test(f))
  .sort()
  .map((f) => ({ pass: f.replace("-notes.md", ""), lines: readFileSync(join(dir, f), "utf8").split("\n") }));

const BLOCKERS: [RegExp, string][] = [
  [/\b403\b|forbidden|bot wall|bot-check|blocked/i, "blocked (403/bot wall)"],
  [/\b429\b|too many requests|rate.?limit/i, "rate-limited (429)"],
  [/javascript|client-side|JS-rendered|loads? (its|their)? ?hours (in|with) (the )?browser|no readable/i, "content rendered by JS"],
  [/search (budget|limit)|websearch.*(limit|exhaust|ran out)/i, "search budget exhausted"],
  [/conflict|contradict|disagree/i, "sources conflict"],
  [/\b(201\d|2020|2021|2022|2023)\b.*(only|old)|too old|outdated|undated/i, "only old/undated sources"],
  [/no (hours|wifi|source)|not (posted|published)|doesn'?t (post|list)/i, "not published anywhere found"],
  [/instagram/i, "Instagram-only presence"],
];

const out: string[] = [
  `# Gap audit (${today()})`,
  "",
  "What research already tried for each missing core detail (wifi, outlets, laptopPolicy, noise, hours), from the notes of 13 research batches and 11 gap-fill passes. Columns: spot · missing · passes that looked at it · blockers seen · next approach.",
  "",
  "| spot | borough · hood | missing | passes | blockers seen | next approach |",
  "|---|---|---|---|---|---|",
];
let gaps = 0;
for (const s of readSpots().filter((x) => !x.closed)) {
  const missing = CORE5.filter((k) => (k === "hours" ? s.hours.value : s.work[k].value) === "unknown");
  if (!missing.length) continue;
  gaps += missing.length;
  const hits = notes.flatMap((n) => n.lines.filter((l) => l.includes(s.slug) || l.includes(s.name)).map((l) => ({ pass: n.pass, l })));
  const passes = [...new Set(hits.map((h) => h.pass))];
  const blockers = [...new Set(BLOCKERS.filter(([re]) => hits.some((h) => re.test(h.l))).map(([, b]) => b))];
  const next: string[] = [];
  if (missing.includes("hours")) next.push(s.category === "library" ? "official library hours data" : "Playwright venue site → Toast/Square/Clover/Linktree → OSM opening_hours");
  if (missing.some((m) => m !== "hours")) next.push("OSM internet_access/socket tags → crowd 'Know this?' → Lexi H8");
  out.push(`| ${s.slug} | ${s.borough} · ${NEIGHBORHOODS[s.neighborhood].en} | ${missing.join(", ")} | ${passes.join(", ") || "—"} | ${blockers.join("; ") || "nothing found in sources read"} | ${next.join("; ")} |`);
}
out.splice(3, 0, `**${gaps} missing core details** across the spots below.`, "");
writeFileSync(join(ROOT, "data/gap-audit.md"), out.join("\n") + "\n");
console.log(`gap-audit: ${gaps} missing core details written to data/gap-audit.md`);
