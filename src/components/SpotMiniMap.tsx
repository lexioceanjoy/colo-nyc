"use client";
import { APIProvider, AdvancedMarker, Map } from "@vis.gl/react-google-maps";
import { useEffect, useRef, useState } from "react";
import type { LatLng } from "@/lib/geo";

const KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY;
const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAP_ID;

/** Small Google map, loaded only when scrolled into view. */
export function SpotMiniMap({ center, name }: { center: LatLng; name: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setVisible(true), { rootMargin: "200px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  if (!KEY || !MAP_ID || failed) return null;
  return (
    <div ref={ref} className="graph-paper h-56 overflow-hidden rounded-xl border border-rule">
      {visible && (
        <APIProvider apiKey={KEY} onError={() => setFailed(true)}>
          <Map mapId={MAP_ID} defaultCenter={center} defaultZoom={16} colorScheme="FOLLOW_SYSTEM" disableDefaultUI clickableIcons={false} className="size-full">
            <AdvancedMarker position={center} title={name} />
          </Map>
        </APIProvider>
      )}
    </div>
  );
}
