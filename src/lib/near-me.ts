"use client";
// Phase 3: "Near me". Location lives only in browser memory: never stored, never in the URL, never sent anywhere.
import { useCallback, useState } from "react";
import { distanceKm, type LatLng } from "./geo";

/** Walking pace ~4.8 km/h (3 mph), and street grids add ~20% to straight-line distance. */
const KM_PER_MIN = 4.8 / 60;
const GRID_FACTOR = 1.2;

export function walkMinutes(km: number): number {
  return Math.max(1, Math.round((km * GRID_FACTOR) / KM_PER_MIN));
}

/** "0.3 mi · 6 min walk" (en) / "约6分钟步行" (zh). */
export function formatWalk(km: number, locale: string): string {
  const min = walkMinutes(km);
  if (locale.startsWith("zh")) return `约${min}分钟步行`;
  const mi = km * 0.621371;
  return `${mi < 0.1 ? "<0.1" : mi.toFixed(1)} mi · ${min} min walk`;
}

/** Within ~75 m of a spot: close enough to suggest checking in. */
export const NUDGE_METERS = 75;
export function isAt(me: LatLng, spot: LatLng): boolean {
  return distanceKm(me, spot) * 1000 <= NUDGE_METERS;
}

export type NearStatus = "idle" | "locating" | "ok" | "denied" | "error" | "unsupported";

/** Map a GeolocationPositionError code to our status (1 = permission denied). */
export function statusFromError(code: number): NearStatus {
  return code === 1 ? "denied" : "error";
}

/**
 * Ask for location only when the user taps (never on load, never automatically again after a denial).
 * The position stays in React state: no storage, no URL, no network.
 */
export function useNearMe() {
  const [status, setStatus] = useState<NearStatus>("idle");
  const [me, setMe] = useState<LatLng | null>(null);
  const request = useCallback(() => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) return setStatus("unsupported");
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setMe({ lat: p.coords.latitude, lng: p.coords.longitude });
        setStatus("ok");
      },
      (err) => setStatus(statusFromError(err.code)),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 60_000 },
    );
  }, []);
  return { status, me, request };
}
