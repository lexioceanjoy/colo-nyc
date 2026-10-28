import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { PublicSession } from "./social";

/** Read one session through the anonymous-safe view (no identities), for share pages and OG images. */
export async function getPublicSession(id: string): Promise<PublicSession | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || !/^[0-9a-f-]{36}$/.test(id)) return null;
  const sb = createClient(url, key, { auth: { persistSession: false } });
  const { data } = await sb.from("public_sessions").select("*").eq("id", id).maybeSingle();
  return (data as PublicSession | null) ?? null;
}
