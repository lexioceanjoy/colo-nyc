"use client";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "./supabase/browser";

// Social data is fetched client-side after load so pages stay static (SPEC §3).

let cache: Promise<Record<string, number>> | null = null;

function fetchTodayCounts(): Promise<Record<string, number>> {
  if (cache) return cache;
  const sb = supabaseBrowser();
  if (!sb) return Promise.resolve({});
  cache = Promise.resolve(sb.rpc("today_counts"))
    .then(({ data, error }) => {
      if (error || !Array.isArray(data)) return {};
      return Object.fromEntries((data as { spot_slug: string; count: number }[]).map((r) => [r.spot_slug, Number(r.count)]));
    })
    .catch(() => ({}));
  return cache;
}

export function useTodayCounts() {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let live = true;
    fetchTodayCounts().then((c) => {
      if (!live) return;
      setCounts(c);
      setReady(Boolean(supabaseBrowser()));
    });
    return () => {
      live = false;
    };
  }, []);
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  return { counts, total, ready };
}

// ───────────── Check-ins, sessions, reports (client-side, RLS-guarded) ─────────────

export type CheckinWindow = "morning" | "afternoon" | "evening" | "all_day";
export type OpenTo = "chat" | "lunch" | "quiet_cowork" | "feedback";
export type PersonCard = { display_name: string; headline: string | null; link_url: string | null; community_tags: string[] };
export type Checkin = {
  id: string;
  user_id: string;
  spot_slug: string;
  window: CheckinWindow;
  open_to: OpenTo[];
  note: string | null;
  profiles: PersonCard | null;
};
export type PublicSession = {
  id: string;
  spot_slug: string;
  starts_at: string;
  ends_at: string;
  title: string;
  description: string | null;
  capacity: number;
  community_tag: string | null;
  rsvp_count: number;
};

const PERSON = "profiles(display_name,headline,link_url,community_tags)";

/** Today's check-ins at a spot (signed-in only; anonymous users get counts from today_counts()). */
export async function fetchCheckins(slug: string, nyToday: string): Promise<Checkin[]> {
  const sb = supabaseBrowser();
  if (!sb) return [];
  const { data } = await sb
    .from("checkins")
    .select(`id,user_id,spot_slug,window,open_to,note,${PERSON}`)
    .eq("spot_slug", slug)
    .eq("ny_date", nyToday)
    .order("created_at");
  return (data as unknown as Checkin[]) ?? [];
}

export async function fetchMyCheckin(userId: string, nyToday: string): Promise<Checkin | null> {
  const sb = supabaseBrowser();
  if (!sb) return null;
  const { data } = await sb.from("checkins").select(`id,user_id,spot_slug,window,open_to,note,${PERSON}`).eq("user_id", userId).eq("ny_date", nyToday).maybeSingle();
  return (data as unknown as Checkin | null) ?? null;
}

/** One check-in per person per NY day: upsert moves it (SPEC §6.4). The DB sets ny_date itself. */
export async function upsertCheckin(userId: string, v: { spot_slug: string; window: CheckinWindow; open_to: OpenTo[]; note: string | null }, existingId?: string) {
  const sb = supabaseBrowser();
  if (!sb) return { error: "unconfigured" };
  const q = existingId
    ? sb.from("checkins").update(v).eq("id", existingId)
    : sb.from("checkins").insert({ ...v, user_id: userId });
  const { error } = await q;
  invalidateCounts();
  return { error: error?.message };
}

export async function deleteCheckin(id: string) {
  const sb = supabaseBrowser();
  if (!sb) return;
  await sb.from("checkins").delete().eq("id", id);
  invalidateCounts();
}

export async function report(target_type: "checkin" | "session" | "profile", target_id: string, reason?: string) {
  const sb = supabaseBrowser();
  if (!sb) return { error: "unconfigured" };
  const { error } = await sb.from("reports").insert({ target_type, target_id, reason: reason ?? null });
  // A repeat report by the same person is a unique violation: treat as already reported.
  return { error: error && error.code !== "23505" ? error.message : undefined };
}

/** Anonymous-safe session list (no host or attendee identity). */
export async function fetchPublicSessions(opts: { slug?: string; id?: string } = {}): Promise<PublicSession[]> {
  const sb = supabaseBrowser();
  if (!sb) return [];
  let q = sb.from("public_sessions").select("*").gt("ends_at", new Date().toISOString()).order("starts_at");
  if (opts.slug) q = q.eq("spot_slug", opts.slug);
  if (opts.id) q = sb.from("public_sessions").select("*").eq("id", opts.id);
  const { data } = await q;
  return (data as PublicSession[]) ?? [];
}

export function invalidateCounts() {
  cache = null;
}

/** Spots with an upcoming session, for the "Has upcoming session" filter. */
export function useSessionSlugs() {
  const [slugs, setSlugs] = useState<Set<string>>(new Set());
  useEffect(() => {
    fetchPublicSessions().then((l) => setSlugs(new Set(l.map((s) => s.spot_slug))));
  }, []);
  return slugs;
}
