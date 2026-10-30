"use client";
import { APIProvider, AdvancedMarker, Map, useMap, type MapCameraChangedEvent } from "@vis.gl/react-google-maps";
import { MarkerClusterer, type Marker, type Renderer } from "@googlemaps/markerclusterer";
import { useEffect, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import type { ClientSpot } from "@/lib/client-spot";
import type { LatLng } from "@/lib/geo";
import { site } from "@/config/site";
import { CATEGORY_COLOR } from "./CategoryDot";

export type Bounds = { north: number; south: number; east: number; west: number };

const KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY;
const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAP_ID;
export const mapConfigured = Boolean(KEY && MAP_ID);

type Props = {
  spots: ClientSpot[];
  coords: Record<string, LatLng>;
  active: string | null;
  today: Record<string, number>;
  onSelect: (slug: string) => void;
  onHover: (slug: string | null) => void;
  onBounds: (b: Bounds) => void;
  onFail: () => void;
  /** Phase 3: the user's location (memory only). Re-centers this same map; no new instance, no extra load. */
  me?: LatLng | null;
};

// Google coordinates are used ONLY here, on the Google map (SPEC §5.4).
export default function MapView(props: Props) {
  const { onFail } = props;
  useEffect(() => {
    if (!mapConfigured) onFail();
    // Maps JS calls this global on key/quota auth failures.
    (window as unknown as { gm_authFailure?: () => void }).gm_authFailure = onFail;
  }, [onFail]);
  if (!mapConfigured) return null;
  return (
    <APIProvider apiKey={KEY!} onError={onFail} language={document.documentElement.lang === "en" ? "en" : "zh-CN"}>
      <Map
        mapId={MAP_ID}
        defaultCenter={site.mapCenter}
        defaultZoom={12}
        colorScheme="FOLLOW_SYSTEM"
        gestureHandling="greedy"
        disableDefaultUI
        zoomControl
        clickableIcons={false}
        className="size-full"
        onCameraChanged={(e: MapCameraChangedEvent) => props.onBounds(e.detail.bounds)}
      >
        <Markers {...props} />
      </Map>
    </APIProvider>
  );
}

// Cluster badge drawn like the score: a ballpoint circle with a count.
const inkClusterRenderer: Renderer = {
  render: ({ count, position }) => {
    const el = document.createElement("div");
    el.dataset.cluster = String(count);
    el.textContent = String(count);
    el.style.cssText =
      "display:grid;place-items:center;width:34px;height:34px;border-radius:999px;background:var(--paper);color:var(--pen);border:2px solid var(--pen);font:600 13px var(--font-ui),system-ui;box-shadow:0 1px 4px rgba(0,0,0,.2)";
    return new google.maps.marker.AdvancedMarkerElement({ position, content: el, zIndex: 1000 + count });
  },
};

function Markers({ spots, coords, active, today, onSelect, onHover, me }: Props) {
  const map = useMap();
  const youAreHere = useTranslations("near")("youAreHere");
  const clusterer = useRef<MarkerClusterer | null>(null);
  // Markers live in a ref, not state: ref callbacks re-run on every render, and storing them in state loops (React #185).
  const markers = useRef(new globalThis.Map<string, Marker>());
  const frame = useRef<number | null>(null);

  const sync = useCallback(() => {
    if (frame.current !== null) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      clusterer.current?.clearMarkers(true);
      clusterer.current?.addMarkers([...markers.current.values()]);
    });
  }, []);

  useEffect(() => {
    if (!map) return;
    // One clusterer per map instance; a clusterer bound to a replaced map never gets a projection and draws nothing.
    const c = new MarkerClusterer({ map, renderer: inkClusterRenderer });
    clusterer.current = c;
    sync();
    return () => {
      c.clearMarkers();
      c.setMap(null);
      if (clusterer.current === c) clusterer.current = null;
    };
  }, [map, sync]);

  // Frame all spots once per map instance (not on every filter change, so panning isn't hijacked).
  const framed = useRef<google.maps.Map | null>(null);
  useEffect(() => {
    if (!map || framed.current === map) return;
    if (me) {
      map.setCenter(me);
      map.setZoom(15);
      framed.current = map;
      return;
    }
    const pts = spots.flatMap((s) => (coords[s.slug] ? [coords[s.slug]] : []));
    if (pts.length < 2) return;
    const b = new google.maps.LatLngBounds();
    for (const p of pts) b.extend(p);
    map.fitBounds(b, 32);
    framed.current = map;
  }, [map, spots, coords, me]);

  // Location arrived after the map was framed: pan the existing map to it.
  const centeredOn = useRef<LatLng | null>(null);
  useEffect(() => {
    if (!map || !me || centeredOn.current === me) return;
    centeredOn.current = me;
    map.panTo(me);
    if ((map.getZoom() ?? 0) < 14) map.setZoom(15);
  }, [map, me]);

  const register = useCallback(
    (slug: string, m: Marker | null) => {
      const prev = markers.current.get(slug);
      if (m === prev || (!m && !prev)) return;
      if (m) markers.current.set(slug, m);
      else markers.current.delete(slug);
      sync();
    },
    [sync],
  );

  return (
    <>
      {me && (
        <AdvancedMarker position={me} zIndex={2000} title={youAreHere}>
          <span className="relative block size-4 rounded-full border-2 border-white bg-[#1a73e8] shadow-[0_0_0_6px_rgba(26,115,232,0.25)]" data-testid="you-are-here" />
        </AdvancedMarker>
      )}
      {spots.map((s) => {
        const pos = coords[s.slug];
        if (!pos) return null;
        return (
          <SpotMarker
            key={s.slug}
            spot={s}
            position={pos}
            active={active === s.slug}
            live={(today[s.slug] ?? 0) > 0}
            register={register}
            onSelect={onSelect}
            onHover={onHover}
          />
        );
      })}
    </>
  );
}

function SpotMarker({
  spot,
  position,
  active,
  live,
  register,
  onSelect,
  onHover,
}: {
  spot: ClientSpot;
  position: LatLng;
  active: boolean;
  live: boolean;
  register: (slug: string, m: Marker | null) => void;
  onSelect: (slug: string) => void;
  onHover: (slug: string | null) => void;
}) {
  const slug = spot.slug;
  const ref = useCallback((m: Marker | null) => register(slug, m), [register, slug]);
  return (
    <AdvancedMarker
      position={position}
      title={spot.name}
      ref={ref}
      onClick={() => onSelect(slug)}
      onMouseEnter={() => onHover(slug)}
      onMouseLeave={() => onHover(null)}
      zIndex={active ? 10 : 1}
    >
      <span
        className={`relative block rounded-full border-2 border-paper shadow-sm transition-transform ${active ? "size-5 scale-125" : "size-4"}`}
        style={{ background: CATEGORY_COLOR[spot.category] }}
      >
        {live && <span className="pulse absolute -right-1 -top-1 size-2.5 rounded-full border border-paper bg-highlight" />}
      </span>
    </AdvancedMarker>
  );
}
