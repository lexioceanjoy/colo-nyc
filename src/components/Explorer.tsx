"use client";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, usePathname } from "@/i18n/navigation";
import type { ClientSpot } from "@/lib/client-spot";
import type { LatLng } from "@/lib/geo";
import { applyFilters, parseFilters, serializeFilters, EMPTY_FILTERS, type FilterState } from "@/lib/filters";
import { useTodayCounts } from "@/lib/social";
import { distanceKm } from "@/lib/geo";
import { useIsDesktop } from "@/lib/use-media";
import { FilterBar } from "./FilterBar";
import { SpotCard } from "./SpotCard";
import type { Bounds } from "./MapView";

const MapView = dynamic(() => import("./MapView"), { ssr: false });

type Props = {
  spots: ClientSpot[];
  /** Google coords (Google map only). */
  mapCoords: Record<string, LatLng>;
  /** Our own non-Google geocodes of `address`, for distance sorting. */
  ownCoords: Record<string, LatLng>;
  footer?: React.ReactNode;
};

export function Explorer(props: Props) {
  // Server render (and no-JS) shows the unfiltered list; URL filters apply after hydration.
  return (
    <Suspense fallback={<ExplorerView {...props} filters={EMPTY_FILTERS} />}>
      <ExplorerWithUrl {...props} />
    </Suspense>
  );
}

function ExplorerWithUrl(props: Props) {
  const search = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const filters = useMemo(() => parseFilters(search), [search]);
  const onChange = useCallback(
    (s: FilterState) => {
      const qs = serializeFilters(s);
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname],
  );
  return <ExplorerView {...props} filters={filters} onChange={onChange} />;
}

type SheetState = "peek" | "half" | "full";

function ExplorerView({
  spots,
  mapCoords,
  ownCoords,
  footer,
  filters,
  onChange,
}: Props & { filters: FilterState; onChange?: (s: FilterState) => void }) {
  const t = useTranslations();
  const { counts, ready: socialReady } = useTodayCounts();
  const [active, setActive] = useState<string | null>(null);
  const [mapWanted, setMapWanted] = useState(false);
  const [mapFailed, setMapFailed] = useState(false);
  const [bounds, setBounds] = useState<Bounds | null>(null);
  const [inView, setInView] = useState(true);
  const [me, setMe] = useState<LatLng | null>(null);
  const [sheet, setSheet] = useState<SheetState>("peek");
  const listRef = useRef<HTMLUListElement>(null);
  // Mount Google Maps in exactly one layout: two instances double-bill map loads and broke clustering.
  const isDesktop = useIsDesktop();

  // Load Google Maps on idle (desktop) or first interaction (phones), per SPEC §6.8. On phones the list sheet
  // over the graph-paper placeholder is the first paint; Maps JS is ~3s of main-thread work on a mid phone.
  useEffect(() => {
    if (isDesktop === null) return;
    const go = () => setMapWanted(true);
    const events = ["pointerdown", "keydown", "wheel"] as const;
    for (const e of events) window.addEventListener(e, go, { once: true, passive: true });
    let idle: number | undefined;
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void };
    if (isDesktop) idle = w.requestIdleCallback ? w.requestIdleCallback(go, { timeout: 2500 }) : window.setTimeout(go, 1500);
    return () => {
      for (const e of events) window.removeEventListener(e, go);
      if (idle !== undefined) (w.cancelIdleCallback ?? window.clearTimeout)(idle);
    };
  }, [isDesktop]);

  // Distance sort: ask for geolocation only when the user picks it.
  useEffect(() => {
    if (filters.sort !== "distance" || me || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((p) => setMe({ lat: p.coords.latitude, lng: p.coords.longitude }));
  }, [filters.sort, me]);

  const social = useMemo(() => ({ todayCounts: counts, sessionSlugs: new Set<string>() }), [counts]);
  const filtered = useMemo(
    () =>
      applyFilters(spots, filters, {
        social,
        distanceKm: me ? (s) => (ownCoords[s.slug] ? distanceKm(me, ownCoords[s.slug]) : undefined) : undefined,
      }),
    [spots, filters, social, me, ownCoords],
  );
  const mapOn = mapWanted && !mapFailed;
  const visible = useMemo(() => {
    if (!mapOn || !inView || !bounds) return filtered;
    return filtered.filter((s) => {
      const c = mapCoords[s.slug];
      return !c || (c.lat <= bounds.north && c.lat >= bounds.south && c.lng <= bounds.east && c.lng >= bounds.west);
    });
  }, [filtered, mapOn, inView, bounds, mapCoords]);

  const onFail = useCallback(() => setMapFailed(true), []);
  const onSelect = useCallback((slug: string) => {
    setActive(slug);
    setSheet((s) => (s === "peek" ? "half" : s));
    requestAnimationFrame(() =>
      listRef.current?.querySelector(`[data-slug="${slug}"]`)?.scrollIntoView({ block: "nearest", behavior: "smooth" }),
    );
  }, []);

  const list = (
    <>
      {mapFailed && (
        <p role="status" className="border-b border-rule bg-paper-2 px-4 py-2 text-sm">
          {t("map.unavailable")}
        </p>
      )}
      {mapOn && (
        <label className="hidden items-center gap-2 border-b border-rule px-4 py-2 text-sm text-pencil lg:flex">
          <input type="checkbox" checked={inView} onChange={(e) => setInView(e.target.checked)} className="accent-[var(--pen)]" />
          {t("filters.searchArea")}
        </label>
      )}
      {visible.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <p className="font-serif text-xl">{spots.length ? t("empty.title") : t("empty.noData")}</p>
          {spots.length > 0 && <p className="mt-1 text-pencil">{t("empty.body")}</p>}
        </div>
      ) : (
        <ul ref={listRef} data-testid="spot-list">
          {visible.map((s) => (
            <SpotCard key={s.slug} spot={s} today={counts[s.slug] ?? 0} active={active === s.slug} onHover={setActive} />
          ))}
        </ul>
      )}
      {footer}
    </>
  );

  const filterBar = (
    <FilterBar
      state={filters}
      onChange={onChange ?? (() => {})}
      count={visible.length}
      hasLocation={Boolean(navigatorHasGeo())}
      socialReady={socialReady}
    />
  );

  const map = (
    <div className="relative size-full graph-paper" aria-label={t("map.showMap")}>
      {!mapOn && !mapFailed && (
        <p className="absolute inset-x-0 top-1/3 text-center text-sm text-pencil">{t("map.loading")}</p>
      )}
      {mapWanted && (
        <MapView
          spots={filtered}
          coords={mapCoords}
          active={active}
          today={counts}
          onSelect={onSelect}
          onHover={setActive}
          onBounds={setBounds}
          onFail={onFail}
        />
      )}
    </div>
  );

  return (
    <div className="flex flex-1 flex-col">
      {/* Desktop: list left (400px), map right */}
      {mapFailed ? (
        <div className="mx-auto hidden w-full max-w-[1600px] lg:block [&_[data-testid=spot-list]]:grid [&_[data-testid=spot-list]]:grid-cols-2 xl:[&_[data-testid=spot-list]]:grid-cols-3">
          {filterBar}
          {list}
        </div>
      ) : (
        <div className="hidden h-[calc(100dvh-3.5rem)] lg:grid lg:grid-cols-[400px_1fr]">
          <section className="flex min-h-0 flex-col border-r border-rule">
            {filterBar}
            <div className="min-h-0 flex-1 overflow-y-auto">{list}</div>
          </section>
          {isDesktop === true ? map : <div className="graph-paper" />}
        </div>
      )}

      {/* Mobile: map with a bottom sheet */}
      <div className="relative h-[calc(100dvh-3.5rem)] overflow-hidden lg:hidden">
        <div className="absolute inset-0">{isDesktop === false ? map : <div className="graph-paper size-full" />}</div>
        <BottomSheet state={mapFailed ? "full" : sheet} onState={setSheet} locked={mapFailed}>
          {filterBar}
          {list}
        </BottomSheet>
      </div>
    </div>
  );
}

function navigatorHasGeo() {
  return typeof navigator !== "undefined" && "geolocation" in navigator;
}

const SHEET_TOP: Record<SheetState, string> = { peek: "calc(100% - 17rem)", half: "45%", full: "0%" };

function BottomSheet({
  state,
  onState,
  locked,
  children,
}: {
  state: SheetState;
  onState: (s: SheetState) => void;
  locked?: boolean;
  children: React.ReactNode;
}) {
  const t = useTranslations("map");
  const startY = useRef<number | null>(null);
  const order: SheetState[] = ["peek", "half", "full"];
  const step = (dir: 1 | -1) => onState(order[Math.min(2, Math.max(0, order.indexOf(state) + dir))]);

  return (
    <section
      className="absolute inset-x-0 bottom-0 z-10 flex flex-col rounded-t-2xl border-t border-rule bg-paper shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.25)] transition-[top] duration-300 motion-reduce:transition-none"
      style={{ top: SHEET_TOP[state] }}
      data-sheet={state}
    >
      {!locked && (
        <div className="flex items-center justify-between px-4 pt-2">
          <button
            type="button"
            className="mx-auto flex h-6 w-full touch-none items-center justify-center"
            aria-label={state === "full" ? t("showMap") : t("showList")}
            onClick={() => onState(state === "full" ? "peek" : "full")}
            onPointerDown={(e) => (startY.current = e.clientY)}
            onPointerUp={(e) => {
              if (startY.current === null) return;
              const dy = e.clientY - startY.current;
              startY.current = null;
              if (Math.abs(dy) > 30) {
                e.preventDefault();
                step(dy < 0 ? 1 : -1);
              }
            }}
          >
            <span className="h-1.5 w-10 rounded-full bg-rule" />
          </button>
        </div>
      )}
      <div className={`min-h-0 flex-1 ${state === "peek" ? "overflow-hidden" : "overflow-y-auto"}`}>{children}</div>
      {!locked && (
        <button
          type="button"
          onClick={() => onState(state === "full" ? "peek" : "full")}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-ink px-4 py-2 text-sm text-paper shadow-lg"
        >
          {state === "full" ? t("showMap") : t("showList")}
        </button>
      )}
    </section>
  );
}
