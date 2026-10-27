"use client";
import { APIProvider, AdvancedMarker, Map, useMap, type MapCameraChangedEvent } from "@vis.gl/react-google-maps";
import { MarkerClusterer, type Marker } from "@googlemaps/markerclusterer";
import { useEffect, useRef, useState, useCallback } from "react";
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
        reuseMaps
        className="size-full"
        onCameraChanged={(e: MapCameraChangedEvent) => props.onBounds(e.detail.bounds)}
      >
        <Markers {...props} />
      </Map>
    </APIProvider>
  );
}

function Markers({ spots, coords, active, today, onSelect, onHover }: Props) {
  const map = useMap();
  const clusterer = useRef<MarkerClusterer | null>(null);
  const [markers, setMarkers] = useState<Record<string, Marker>>({});

  useEffect(() => {
    if (!map) return;
    clusterer.current ??= new MarkerClusterer({ map });
    return () => clusterer.current?.clearMarkers();
  }, [map]);

  useEffect(() => {
    clusterer.current?.clearMarkers();
    clusterer.current?.addMarkers(Object.values(markers));
  }, [markers]);

  const setRef = useCallback((slug: string, m: Marker | null) => {
    setMarkers((prev) => {
      if ((m && prev[slug] === m) || (!m && !prev[slug])) return prev;
      const next = { ...prev };
      if (m) next[slug] = m;
      else delete next[slug];
      return next;
    });
  }, []);

  return (
    <>
      {spots.map((s) => {
        const pos = coords[s.slug];
        if (!pos) return null;
        const isActive = active === s.slug;
        const live = (today[s.slug] ?? 0) > 0;
        return (
          <AdvancedMarker
            key={s.slug}
            position={pos}
            title={s.name}
            ref={(m) => setRef(s.slug, m)}
            onClick={() => onSelect(s.slug)}
            onMouseEnter={() => onHover(s.slug)}
            onMouseLeave={() => onHover(null)}
            zIndex={isActive ? 10 : 1}
          >
            <span
              className={`relative block rounded-full border-2 border-paper shadow-sm transition-transform ${isActive ? "size-5 scale-125" : "size-4"}`}
              style={{ background: CATEGORY_COLOR[s.category] }}
            >
              {live && <span className="pulse absolute -right-1 -top-1 size-2.5 rounded-full border border-paper bg-highlight" />}
            </span>
          </AdvancedMarker>
        );
      })}
    </>
  );
}
