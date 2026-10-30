"use client";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { CATEGORIES, BOROUGHS } from "@/lib/schema";
import { FLAG_FILTERS, SORTS, activeFilterCount, type FilterState, type FlagFilter } from "@/lib/filters";
import { NEIGHBORHOODS, type NeighborhoodKey } from "@/data/neighborhoods";
import type { NearStatus } from "@/lib/near-me";

const PRIMARY: FlagFilter[] = ["open", "free", "wifi", "outlets", "quiet", "group"];
/** On desktop the chips wrap; past this many lines the row keeps the first TOP chips and the rest move under "More filters". */
const MAX_LINES = 2;
const TOP = 5;

const chipClass = (on: boolean) =>
  `shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-sm transition-colors ${
    on ? "border-pen bg-pen text-paper" : "border-rule bg-paper hover:border-pen"
  }`;

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={chipClass(on)}
    >
      {children}
    </button>
  );
}

export function FilterBar({
  state,
  onChange,
  count,
  hasLocation,
  socialReady,
  near,
}: {
  state: FilterState;
  onChange: (s: FilterState) => void;
  count: number;
  hasLocation: boolean;
  socialReady: boolean;
  /** Phase 3 "Near me" (absent when the flag is off). */
  near?: { status: NearStatus; request: () => void; walkMax: 10 | 20 | null; setWalkMax: (v: 10 | 20 | null) => void };
}) {
  const t = useTranslations("filters");
  const tn = useTranslations("near");
  const tc = useTranslations("category");
  const tb = useTranslations("borough");
  const locale = useLocale() as "en" | "zh";
  const [more, setMore] = useState(false);

  const toggleFlag = (f: FlagFilter) =>
    onChange({ ...state, flags: state.flags.includes(f) ? state.flags.filter((x) => x !== f) : [...state.flags, f] });
  const toggleCat = (c: (typeof CATEGORIES)[number]) =>
    onChange({ ...state, cat: state.cat.includes(c) ? state.cat.filter((x) => x !== c) : [...state.cat, c] });

  const secondary = FLAG_FILTERS.filter(
    (f) => !PRIMARY.includes(f) && (socialReady || (f !== "today" && f !== "session")),
  );
  const hoods = (Object.keys(NEIGHBORHOODS) as NeighborhoodKey[]).filter(
    (k) => !state.boro || NEIGHBORHOODS[k].borough === state.boro,
  );
  const n = activeFilterCount(state);

  const items = [
    ...(near
      ? [{ key: "near", on: near.status === "ok", onClick: near.request, text: near.status === "locating" ? tn("locating") : tn("button") }]
      : []),
    ...PRIMARY.map((f) => ({ key: f, on: state.flags.includes(f), onClick: () => toggleFlag(f), text: t(f) })),
  ];

  // Desktop wraps the row. An invisible copy measures how many lines the full row takes,
  // so the decision doesn't flip-flop with what's rendered. It's display:none below lg.
  const scroller = useRef<HTMLDivElement>(null);
  const measurer = useRef<HTMLDivElement>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [atEnd, setAtEnd] = useState(true);
  const onScroll = useCallback(() => {
    const el = scroller.current;
    if (el) setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
  }, []);
  useEffect(() => {
    const ro = new ResizeObserver(() => {
      const m = measurer.current;
      if (m) setCollapsed(new Set(Array.from(m.children, (c) => (c as HTMLElement).offsetTop)).size > MAX_LINES);
      onScroll();
    });
    if (measurer.current) ro.observe(measurer.current);
    if (scroller.current) ro.observe(scroller.current);
    return () => ro.disconnect();
  }, [onScroll]);

  const shown = collapsed ? items.slice(0, TOP) : items;
  const panelFlags = [...PRIMARY.filter((f) => !shown.some((i) => i.key === f)), ...secondary];
  // Active filters the row doesn't show; the More button carries their count.
  const hiddenOn =
    panelFlags.filter((f) => state.flags.includes(f)).length + state.cat.length + (state.boro ? 1 : 0) + (state.hood ? 1 : 0);

  return (
    <div className="border-b border-rule bg-paper" role="region" aria-label={t("label")}>
      <div className="relative">
        <div
          ref={scroller}
          onScroll={onScroll}
          // Keyboard focus: bring the chip fully into view, clear of the right-edge fade (scroll-px-10).
          onFocus={(e) => e.target.scrollIntoView({ block: "nearest", inline: "nearest" })}
          data-testid="filter-chips"
          className="flex scroll-px-10 items-center gap-2 overflow-x-auto overscroll-x-contain px-4 py-2 [scrollbar-width:none] lg:flex-wrap lg:gap-1.5 lg:overflow-visible"
        >
          {shown.map((i) => (
            <Chip key={i.key} on={i.on} onClick={i.onClick}>
              {i.key === "near" ? <span data-testid="near-me">{i.text}</span> : i.text}
            </Chip>
          ))}
          <button
            type="button"
            aria-expanded={more}
            aria-controls="more-filters"
            onClick={() => setMore((m) => !m)}
            data-testid="more-filters-toggle"
            className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-sm text-pen underline-offset-4 hover:underline ${hiddenOn > 0 ? "font-semibold" : ""}`}
          >
            {t("more")}
            {hiddenOn > 0 && (
              <span data-testid="more-filters-count">
                {" · "}
                {hiddenOn}
              </span>
            )}
          </button>
        </div>
        {!atEnd && (
          <div aria-hidden data-testid="chips-fade" className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-linear-to-l from-paper lg:hidden" />
        )}
        <div
          ref={measurer}
          aria-hidden
          inert
          className="pointer-events-none invisible absolute inset-x-0 top-0 hidden px-4 py-2 lg:flex lg:flex-wrap lg:gap-1.5"
        >
          {items.map((i) => (
            <span key={i.key} className={chipClass(false)}>
              {i.text}
            </span>
          ))}
          <span className="whitespace-nowrap px-3 py-1.5 text-sm">
            {t("more")} · 0
          </span>
        </div>
      </div>

      {near?.status === "ok" && (
        <div className="flex items-center gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none]" data-testid="near-chips">
          {([10, 20] as const).map((m) => (
            <Chip key={m} on={near.walkMax === m} onClick={() => near.setWalkMax(near.walkMax === m ? null : m)}>
              {tn(m === 10 ? "walk10" : "walk20")}
            </Chip>
          ))}
          <Chip
            on={state.flags.includes("open") && state.sort === "distance"}
            onClick={() =>
              onChange({ ...state, sort: "distance", flags: state.flags.includes("open") ? state.flags.filter((x) => x !== "open") : [...state.flags, "open"] })
            }
          >
            {tn("openNear")}
          </Chip>
        </div>
      )}
      {near && (near.status === "denied" || near.status === "error" || near.status === "unsupported") && (
        <div role="status" className="flex flex-wrap items-center gap-2 border-t border-rule bg-paper-2 px-4 py-2 text-sm" data-testid="near-fallback">
          <span>{tn(near.status)}</span>
          <select
            aria-label={t("neighborhood")}
            value={state.hood ?? ""}
            onChange={(e) => onChange({ ...state, hood: (e.target.value || null) as NeighborhoodKey | null })}
            className="max-w-56 rounded-md border border-rule bg-paper px-2 py-1"
          >
            <option value="">{t("allNeighborhoods")}</option>
            {(Object.keys(NEIGHBORHOODS) as NeighborhoodKey[]).map((k) => (
              <option key={k} value={k}>
                {NEIGHBORHOODS[k][locale]}
              </option>
            ))}
          </select>
          {near.status !== "unsupported" && (
            <button type="button" onClick={near.request} className="text-pen underline">
              {tn("retry")}
            </button>
          )}
        </div>
      )}
      {more && (
        <div id="more-filters" className="space-y-3 border-t border-rule px-4 py-3 text-sm">
          <fieldset className="flex flex-wrap gap-2">
            <legend className="mb-1 w-full text-pencil">{t("category")}</legend>
            {CATEGORIES.map((c) => (
              <Chip key={c} on={state.cat.includes(c)} onClick={() => toggleCat(c)}>
                {tc(c)}
              </Chip>
            ))}
          </fieldset>
          <fieldset className="flex flex-wrap gap-2">
            <legend className="mb-1 w-full text-pencil">{t("label")}</legend>
            {panelFlags.map((f) => (
              <Chip key={f} on={state.flags.includes(f)} onClick={() => toggleFlag(f)}>
                {t(f)}
              </Chip>
            ))}
          </fieldset>
          <div className="flex flex-wrap gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-pencil">{t("borough")}</span>
              <select
                value={state.boro ?? ""}
                onChange={(e) =>
                  onChange({ ...state, boro: (e.target.value || null) as FilterState["boro"], hood: null })
                }
                className="rounded-md border border-rule bg-paper px-2 py-1.5"
              >
                <option value="">{t("allBoroughs")}</option>
                {BOROUGHS.map((b) => (
                  <option key={b} value={b}>
                    {tb(b)}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-pencil">{t("neighborhood")}</span>
              <select
                value={state.hood ?? ""}
                onChange={(e) => onChange({ ...state, hood: (e.target.value || null) as NeighborhoodKey | null })}
                className="max-w-56 rounded-md border border-rule bg-paper px-2 py-1.5"
              >
                <option value="">{t("allNeighborhoods")}</option>
                {hoods.map((k) => (
                  <option key={k} value={k}>
                    {NEIGHBORHOODS[k][locale]}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-2 px-4 pb-2 text-sm">
        <span className="text-pencil" aria-live="polite" data-testid="result-count">
          {t("results", { count })}
        </span>
        <span className="flex items-center gap-3">
          {n > 0 && (
            <button type="button" className="text-pen hover:underline" onClick={() => onChange({ ...state, flags: [], cat: [], boro: null, hood: null })}>
              {t("clear")}
            </button>
          )}
          <label className="flex items-center gap-1">
            <span className="text-pencil">{t("sort")}</span>
            <select
              value={state.sort}
              onChange={(e) => onChange({ ...state, sort: e.target.value as FilterState["sort"] })}
              className="rounded-md border border-rule bg-paper px-1 py-1"
            >
              {SORTS.filter((s) => (s !== "distance" || hasLocation || near) && (s !== "people" || socialReady)).map((s) => (
                <option key={s} value={s}>
                  {t(s === "score" ? "sortScore" : s === "distance" ? "sortDistance" : "sortPeople")}
                </option>
              ))}
            </select>
          </label>
        </span>
      </div>
    </div>
  );
}
