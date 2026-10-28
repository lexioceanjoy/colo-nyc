/**
 * pnpm data:pages — render venue pages with Playwright for the research pass (SPEC §5.2, coverage pass 2).
 * Polite by construction: robots.txt is checked first, the UA says who we are, one request at a time with a delay,
 * and any 403/429/503 or challenge page ("verify you are human", CAPTCHA, Cloudflare) is recorded as BLOCKED and never retried.
 * Output: .cache/pages/<slug>/*.txt (visible text) + .cache/pages/index.json. Nothing here is committed.
 */
import { chromium } from "@playwright/test";
import robotsParser from "robots-parser";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { readSpots, ROOT } from "./lib/spots-io";

const UA = "ColoNYC-research/1.0 (+https://github.com/lexioceanjoy/colo-nyc)";
const OUT = join(ROOT, ".cache/pages");
const SKIP_HOSTS = /(^|\.)nypl\.org$|instagram\.com$|facebook\.com$|yelp\.com$|google\.|order\.toasttab\.com$/; // bot walls / blocked robots / not sources
const ORDERING = /toasttab\.com|square\.site|squareup\.com|clover\.com|linktr\.ee|joe\.coffee/;
const CHALLENGE = /verify you are human|are you a robot|captcha|just a moment\.\.\.|attention required|access denied|cf-chl|unusual traffic/i;
const CORE = ["wifi", "outlets", "laptopPolicy", "noise"] as const;

const robotsCache = new Map<string, ReturnType<typeof robotsParser> | null>();
async function allowed(url: string): Promise<boolean | "blocked"> {
  const u = new URL(url);
  if (SKIP_HOSTS.test(u.hostname)) return "blocked";
  if (!robotsCache.has(u.origin)) {
    try {
      const r = await fetch(`${u.origin}/robots.txt`, { headers: { "User-Agent": UA } });
      if (r.status === 401 || r.status === 403) robotsCache.set(u.origin, null); // robots itself forbidden → treat as blocked
      else robotsCache.set(u.origin, robotsParser(`${u.origin}/robots.txt`, r.ok ? await r.text() : ""));
    } catch {
      robotsCache.set(u.origin, robotsParser(`${u.origin}/robots.txt`, ""));
    }
  }
  const rp = robotsCache.get(u.origin);
  if (rp === null) return "blocked";
  return rp!.isAllowed(url, UA) !== false;
}

const spots = readSpots().filter((s) => !s.closed && s.website);
const only = process.argv.slice(2);
const targets = spots.filter(
  (s) =>
    (!only.length || only.includes(s.slug)) &&
    (s.hours.value === "unknown" || CORE.some((k) => s.work[k].value === "unknown")) &&
    !(s.category === "library" && s.borough === "manhattan"),
);

const browser = await chromium.launch();
const ctx = await browser.newContext({ userAgent: UA, viewport: { width: 1280, height: 900 } });
const index: Record<string, { url: string; status: string; file?: string }[]> = {};
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function grab(slug: string, url: string, n: number): Promise<string[]> {
  const ok = await allowed(url);
  if (ok !== true) {
    (index[slug] ??= []).push({ url, status: ok === "blocked" ? "BLOCKED (bot wall / robots)" : "DISALLOWED by robots.txt" });
    return [];
  }
  const page = await ctx.newPage();
  try {
    const res = await page.goto(url, { waitUntil: "networkidle", timeout: 25_000 });
    const status = res?.status() ?? 0;
    const text = (await page.locator("body").innerText({ timeout: 5000 }).catch(() => "")).replace(/\n{3,}/g, "\n\n").slice(0, 40_000);
    if ([401, 403, 429, 503].includes(status) || CHALLENGE.test(text.slice(0, 3000))) {
      (index[slug] ??= []).push({ url, status: `BLOCKED (${status || "challenge"}) — not retried` });
      return [];
    }
    const file = join(OUT, slug, `${n}.txt`);
    mkdirSync(join(OUT, slug), { recursive: true });
    writeFileSync(file, `URL: ${url}\nFETCHED: ${new Date().toISOString()}\n\n${text}`);
    (index[slug] ??= []).push({ url, status: String(status), file: file.replace(ROOT + "/", "") });
    const links = await page.$$eval("a[href]", (as) => as.map((a) => (a as HTMLAnchorElement).href));
    return [...new Set(links)].filter((l) => /hours|visit|location|contact|about|faq|menu|toasttab|square|clover|linktr|joe\.coffee/i.test(l));
  } catch (e) {
    (index[slug] ??= []).push({ url, status: `ERROR ${(e as Error).message.slice(0, 80)}` });
    return [];
  } finally {
    await page.close();
  }
}

for (const s of targets) {
  const home = s.website!;
  const links = await grab(s.slug, home, 0);
  const host = new URL(home).hostname;
  // Follow at most 3 same-site info pages and 2 ordering/linktree pages.
  const same = links.filter((l) => { try { return new URL(l).hostname === host && l !== home; } catch { return false; } }).slice(0, 3);
  const ordering = links.filter((l) => ORDERING.test(l)).slice(0, 2);
  let n = 1;
  for (const l of [...same, ...ordering]) {
    await sleep(1500);
    await grab(s.slug, l, n++);
  }
  await sleep(1500);
}
await browser.close();
mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, "index.json"), JSON.stringify(index, null, 1));
const all = Object.values(index).flat();
console.log(`pages: ${targets.length} spots · ${all.filter((x) => x.file).length} saved · ${all.filter((x) => /BLOCKED|DISALLOWED/.test(x.status)).length} blocked/disallowed · ${all.filter((x) => x.status.startsWith("ERROR")).length} errors`);
