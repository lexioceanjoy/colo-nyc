/** pnpm env:check — verify every secret is present and works, without printing values. */
import "./lib/env";
import { execSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";

const results: [string, boolean, string][] = [];
const ok = (name: string, pass: boolean, detail = "") => results.push([name, pass, detail]);
const has = (k: string) => Boolean(process.env[k]?.trim());

try {
  execSync("gh auth status", { stdio: "pipe" });
  ok("H1 gh auth", true);
} catch {
  ok("H1 gh auth", false, "run `gh auth login`");
}

for (const k of ["NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY", "NEXT_PUBLIC_GOOGLE_MAP_ID", "GOOGLE_PLACES_SERVER_KEY", "NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY", "ADMIN_EMAILS", "IP_HASH_SALT"])
  ok(`env ${k}`, has(k), has(k) ? "" : "missing in .env.local");

// Server key: Text Search with an ids-only mask (cheapest SKU).
if (has("GOOGLE_PLACES_SERVER_KEY")) {
  const r = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Goog-Api-Key": process.env.GOOGLE_PLACES_SERVER_KEY!, "X-Goog-FieldMask": "places.id" },
    body: JSON.stringify({ textQuery: "Stavros Niarchos Foundation Library New York", pageSize: 1 }),
  });
  const j = (await r.json().catch(() => ({}))) as { places?: unknown[]; error?: { message?: string } };
  ok("H3 server key → Places API (New)", r.ok && Boolean(j.places?.length), r.ok ? "" : `${r.status} ${j.error?.message ?? ""}`);
}

// Browser key must NOT work from a non-allowed referrer, and must load Maps JS for localhost.
if (has("NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY")) {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY!;
  const places = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Goog-Api-Key": key, "X-Goog-FieldMask": "places.id", Referer: "http://localhost:3000/" },
    body: JSON.stringify({ textQuery: "test" }),
  });
  ok("H3 browser key is NOT allowed on Places API", !places.ok, places.ok ? "browser key can call Places: restrict it to Maps JavaScript API only" : "");
  const js = await fetch(`https://maps.googleapis.com/maps/api/js?key=${key}&v=weekly`, { headers: { Referer: "http://localhost:3000/" } });
  ok("H3 browser key serves Maps JS for localhost", js.ok, js.ok ? "(full auth check happens in the browser smoke test)" : `${js.status}`);
}

if (has("NEXT_PUBLIC_SUPABASE_URL") && has("NEXT_PUBLIC_SUPABASE_ANON_KEY")) {
  const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
  const { error } = await anon.rpc("today_counts");
  ok("H5 Supabase anon → today_counts()", !error, error ? `${error.message} (run migrations: pnpm exec supabase db push)` : "");
  const { error: e2 } = await anon.from("profiles").select("display_name").limit(1);
  ok("RLS: anon cannot read profiles", Boolean(e2), e2 ? "" : "anon could select profiles!");
}
if (has("NEXT_PUBLIC_SUPABASE_URL") && has("SUPABASE_SERVICE_ROLE_KEY")) {
  const svc = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
  const { error } = await svc.from("place_geo").select("place_id", { count: "exact", head: true });
  ok("H5 Supabase service role → place_geo", !error, error?.message ?? "");
}

for (const [name, pass, detail] of results) console.log(`${pass ? "✓" : "✗"} ${name}${detail ? `  — ${detail}` : ""}`);
process.exit(results.every((r) => r[1]) ? 0 : 1);
