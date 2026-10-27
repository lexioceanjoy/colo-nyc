"use client";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { CATEGORIES, BOROUGHS } from "@/lib/schema";
import { FLAG_FILTERS, SORTS, activeFilterCount, type FilterState, type FlagFilter } from "@/lib/filters";
import { NEIGHBORHOODS, type NeighborhoodKey } from "@/data/neighborhoods";

const PRIMARY: FlagFilter[] = ["open", "free", "wifi", "outlets", "quiet", "group"];

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-sm transition-colors ${
        on ? "border-pen bg-pen text-paper" : "border-rule bg-paper hover:border-pen"
      }`}
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
}: {
  state: FilterState;
  onChange: (s: FilterState) => void;
  count: number;
  hasLocation: boolean;
  socialReady: boolean;
}) {
  const t = useTranslations("filters");
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

  return (
    <div className="border-b border-rule bg-paper" role="region" aria-label={t("label")}>
      <div className="flex items-center gap-2 overflow-x-auto px-4 py-2 [scrollbar-width:none]">
        {PRIMARY.map((f) => (
          <Chip key={f} on={state.flags.includes(f)} onClick={() => toggleFlag(f)}>
            {t(f)}
          </Chip>
        ))}
        <button
          type="button"
          aria-expanded={more}
          aria-controls="more-filters"
          onClick={() => setMore((m) => !m)}
          className="shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-sm text-pen underline-offset-4 hover:underline"
        >
          {t("more")}
          {n > 0 && ` (${n})`}
        </button>
      </div>

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
            {secondary.map((f) => (
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
              {SORTS.filter((s) => (s !== "distance" || hasLocation) && (s !== "people" || socialReady)).map((s) => (
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
