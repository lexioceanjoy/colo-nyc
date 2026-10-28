"use client";
import { useEffect, useState, useCallback } from "react";
import type { User } from "@supabase/supabase-js";
import { supabaseBrowser } from "./supabase/browser";

export type Profile = {
  id: string;
  display_name: string;
  headline: string | null;
  link_url: string | null;
  community_tags: string[];
  locale: "en" | "zh";
};

/** Client-side session + profile. Pages stay static; this hydrates after load (SPEC §3). */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const sb = supabaseBrowser(); // createBrowserClient returns a singleton in the browser
  const [loading, setLoading] = useState(() => Boolean(sb));

  const loadProfile = useCallback(
    async (u: User | null) => {
      if (!sb || !u) return setProfile(null);
      const { data } = await sb.from("profiles").select("id,display_name,headline,link_url,community_tags,locale").eq("id", u.id).maybeSingle();
      setProfile((data as Profile | null) ?? null);
    },
    [sb],
  );

  useEffect(() => {
    if (!sb) return;
    let live = true;
    sb.auth.getUser().then(async ({ data }) => {
      if (!live) return;
      setUser(data.user);
      await loadProfile(data.user);
      if (live) setLoading(false);
    });
    const { data: sub } = sb.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      loadProfile(session?.user ?? null);
    });
    return () => {
      live = false;
      sub.subscription.unsubscribe();
    };
  }, [sb, loadProfile]);

  return { user, profile, loading, configured: Boolean(sb), reloadProfile: () => loadProfile(user) };
}

/** Starts Google OAuth (PKCE). The callback route decides onboarding vs. `next`. */
export async function signInWithGoogle(locale: string, next: string) {
  const sb = supabaseBrowser();
  if (!sb) return;
  const redirectTo = `${window.location.origin}/auth/callback?locale=${locale}&next=${encodeURIComponent(next)}`;
  await sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo } });
}

/** Path + query to come back to after signing in. */
export function currentPath() {
  return window.location.pathname + window.location.search;
}
