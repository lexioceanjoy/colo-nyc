import "server-only";
import { createClient } from "@supabase/supabase-js";

const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

function anonClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

/** Google lat/lng cache. Rows older than 30 days are never served (SPEC §4.2). */
export async function getPlaceGeo(placeIds: string[]): Promise<Record<string, { lat: number; lng: number }>> {
  const sb = anonClient();
  if (!sb || placeIds.length === 0) return {};
  const cutoff = new Date(Date.now() - MAX_AGE_MS).toISOString();
  const { data, error } = await sb
    .from("place_geo")
    .select("place_id,lat,lng")
    .in("place_id", placeIds)
    .gte("fetched_at", cutoff);
  if (error) {
    console.warn("[place_geo] read failed:", error.message);
    return {};
  }
  return Object.fromEntries(data.map((r) => [r.place_id, { lat: r.lat, lng: r.lng }]));
}
