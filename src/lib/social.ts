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
