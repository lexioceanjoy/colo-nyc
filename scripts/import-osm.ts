/**
 * pnpm data:osm — import OpenStreetMap tags (opening_hours, internet_access, power_supply/socket) for spots whose
 * core details are still unknown. Matching uses OUR open-data coordinates (address-geo.json), never Google's.
 * Data © OpenStreetMap contributors, ODbL 1.0 (credited on the About page). Never overwrites a known value.
 */
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { readSpots, writeSpots, ROOT, today } from "./lib/spots-io";
import { parseOsmHours } from "./lib/osm-hours";
import { nameSimilarity } from "./resolve-places";
import type { Spot } from "../src/lib/schema";

type El = { type: string; id: number; lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string> };
const geo: Record<string, { lat: number; lng: number }> = JSON.parse(readFileSync(join(ROOT, "src/data/address-geo.json"), "utf8"));
const spots = readSpots();
const live = spots.filter((s) => !s.closed && geo[s.slug]);

const parts = live.map((s) => `nwr(around:70,${geo[s.slug].lat},${geo[s.slug].lng})["name"];`).join("\n");
const query = `[out:json][timeout:90];(\n${parts}\n);out tags center;`;
// One Overpass query per day at most: the raw response is cached locally (git-ignored, never committed).
const cacheFile = join(ROOT, ".cache/overpass.json");
let els: El[];
if (existsSync(cacheFile) && Date.now() - statSync(cacheFile).mtimeMs < 86400_000) els = JSON.parse(readFileSync(cacheFile, "utf8"));
else {
  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "colo-nyc data import (github.com/lexioceanjoy/colo-nyc)" },
    body: "data=" + encodeURIComponent(query),
  });
  if (!res.ok) throw new Error(`Overpass ${res.status}: ${(await res.text()).slice(0, 200)}`);
  els = ((await res.json()) as { elements: El[] }).elements;
  mkdirSync(join(ROOT, ".cache"), { recursive: true });
  writeFileSync(cacheFile, JSON.stringify(els));
}
console.log(`Overpass returned ${els.length} named objects near ${live.length} spots`);

const dist = (a: { lat: number; lng: number }, b: { lat: number; lon: number }) => {
  const k = 111_000;
  return Math.hypot((a.lat - b.lat) * k, (a.lng - b.lon) * k * Math.cos((a.lat * Math.PI) / 180));
};
/** Which OSM objects may speak for a spot of this category (a bank's hours are not its café's hours). */
function compatible(s: Spot, t: Record<string, string>, field: "hours" | "amenities"): boolean {
  const a = t.amenity ?? "";
  if (a === "bank" || a === "atm") return false;
  switch (s.category) {
    case "cafe":
      return ["cafe", "restaurant", "bar", "fast_food", "ice_cream"].includes(a) || Boolean(t.shop);
    case "library":
      return a === "library";
    case "hotel_lobby":
      // Lobby hours come from the lobby café/bar, never from the hotel object (hotels are "24/7" for guests).
      return field === "hours" ? ["cafe", "bar", "restaurant"].includes(a) : ["cafe", "bar", "restaurant"].includes(a) || t.tourism === "hotel";
    case "museum":
      return ["cafe", "restaurant"].includes(a) || t.tourism === "museum";
    default:
      return !["bank", "atm"].includes(a);
  }
}

const recent = (t: Record<string, string>) => {
  const d = t["check_date:opening_hours"] ?? t["check_date"] ?? t["survey:date"];
  return d && d >= "2025-04" ? d : null;
};

const log: string[] = [];
let filled = 0;
for (const s of live) {
  const g = geo[s.slug];
  const candidates = els
    .map((e) => ({ e, pos: e.center ?? (e.lat != null ? { lat: e.lat, lon: e.lon! } : null) }))
    .filter((x) => x.pos && x.e.tags?.name)
    .map((x) => ({ ...x, sim: nameSimilarity(s.name, x.e.tags!.name), d: dist(g, x.pos!) }))
    .filter((x) => x.sim >= 0.6 && x.d <= 70 && (compatible(s, x.e.tags!, "hours") || compatible(s, x.e.tags!, "amenities")))
    .sort((a, b) => b.sim - a.sim || a.d - b.d);
  const best = candidates[0];
  if (!best) continue;
  const t = best.e.tags!;
  const src = `https://www.openstreetmap.org/${best.e.type}/${best.e.id}`;
  const checked = recent(t);
  const conf = checked ? "medium" : "low";
  const touched: string[] = [];
  const note = (en: string, zh: string) => ({ en: `OpenStreetMap: ${en}${checked ? ` (checked ${checked})` : ""}`, zh: `OpenStreetMap：${zh}${checked ? `（${checked} 核对）` : ""}` });

  if (s.hours.value === "unknown" && t.opening_hours && compatible(s, t, "hours")) {
    const h = parseOsmHours(t.opening_hours);
    if (h) {
      s.hours = { value: h, confidence: conf, sources: [src], checkedAt: today(), note: note("community-mapped opening hours", "社区维护的营业时间") };
      touched.push("hours");
    }
  }
  const ia = t.internet_access;
  if (s.work.wifi.value === "unknown" && ia && compatible(s, t, "amenities")) {
    if (/^(wlan|yes|wifi)$/.test(ia)) {
      s.work.wifi = { value: "ok", confidence: "low", sources: [src], checkedAt: today(), note: note("Wi-Fi available; speed not recorded", "有 Wi-Fi，网速未记录") };
      touched.push("wifi");
    } else if (ia === "no") {
      s.work.wifi = { value: "none", confidence: conf, sources: [src], checkedAt: today(), note: note("no internet access", "没有网络") };
      touched.push("wifi");
    }
  }
  const ps = t.power_supply ?? (Object.keys(t).some((k) => k.startsWith("socket:")) ? "yes" : undefined);
  if (s.work.outlets.value === "unknown" && ps && compatible(s, t, "amenities")) {
    if (ps === "yes") {
      s.work.outlets = { value: "some", confidence: "low", sources: [src], checkedAt: today(), note: note("outlets available; how many isn't recorded", "有插座，数量未记录") };
      touched.push("outlets");
    } else if (ps === "no") {
      s.work.outlets = { value: "none", confidence: conf, sources: [src], checkedAt: today(), note: note("no outlets for customers", "没有给顾客用的插座") };
      touched.push("outlets");
    }
  }
  if (touched.length) {
    s.updatedAt = today();
    filled += touched.length;
    log.push(`| ${s.slug} | ${t.name} | ${Math.round(best.d)} m | ${touched.join(", ")} | ${src} |`);
  }
}
writeSpots(spots as Spot[]);
const md = [`# OSM import (${today()})`, "", "Data © OpenStreetMap contributors, ODbL 1.0. Matched by name (≥0.6) within 70 m of our own geocoded address.", "", "| spot | OSM name | distance | filled | source |", "|---|---|---|---|---|", ...log].join("\n");
writeFileSync(join(ROOT, "data/osm-import.md"), md + "\n");
console.log(`OSM: filled ${filled} core details on ${log.length} spots → data/osm-import.md`);
