"use client";
import { useCallback, useEffect, useState } from "react";
import { supabaseBrowser } from "./supabase/browser";
import type { Core5 } from "./core";

// Crowd confirmations (2026-10-28): private votes, public aggregate once 2+ people agree.

export const CROWD_OPTIONS: Record<Exclude<Core5, "hours">, readonly string[]> = {
  wifi: ["strong", "ok", "weak", "none"],
  outlets: ["many", "some", "few", "none"],
  laptopPolicy: ["welcome", "weekdays_only", "restricted_areas", "discouraged"],
  noise: ["quiet", "moderate", "lively"],
};

export type Confirmed = Partial<Record<Core5, { value: string; votes: number }>>;

export function useConfirmed(slug: string) {
  const [confirmed, setConfirmed] = useState<Confirmed>({});
  // False until the backend answers; stays false if the crowd migration isn't applied, so the UI hides itself.
  const [available, setAvailable] = useState(false);
  const load = useCallback(async () => {
    const sb = supabaseBrowser();
    if (!sb) return;
    const { data, error } = await sb.rpc("confirmed_details", { p_slug: slug });
    setAvailable(!error);
    if (error) return;
    const out: Confirmed = {};
    for (const r of (data as { field: Core5; value: string; votes: number }[] | null) ?? []) out[r.field] = { value: r.value, votes: Number(r.votes) };
    setConfirmed(out);
  }, [slug]);
  useEffect(() => {
    const id = setTimeout(load, 0);
    return () => clearTimeout(id);
  }, [load]);
  return { confirmed, available, reload: load };
}

export async function myVotes(userId: string, slug: string): Promise<Partial<Record<Core5, string>>> {
  const sb = supabaseBrowser();
  if (!sb) return {};
  const { data } = await sb.from("detail_votes").select("field,value").eq("user_id", userId).eq("spot_slug", slug);
  return Object.fromEntries(((data as { field: Core5; value: string }[]) ?? []).map((r) => [r.field, r.value]));
}

export async function vote(userId: string, slug: string, field: Core5, value: string) {
  const sb = supabaseBrowser();
  if (!sb) return { error: "unconfigured" };
  const { error } = await sb
    .from("detail_votes")
    .upsert({ user_id: userId, spot_slug: slug, field, value, updated_at: new Date().toISOString() }, { onConflict: "user_id,spot_slug,field" });
  return { error: error?.message };
}

/** "07-18|08-17" → readable per locale, e.g. "Mon–Fri 7am–6pm · Sat–Sun 8am–5pm". */
export function formatHoursVote(v: string, labels: { weekday: string; weekend: string; closed: string }, fmt: (hh: string) => string) {
  const [wd, we] = v.split("|");
  const one = (r: string) => (r === "closed" ? labels.closed : r.split("-").map((h) => fmt(`${h}:00`)).join("–"));
  return `${labels.weekday} ${one(wd)} · ${labels.weekend} ${one(we)}`;
}
