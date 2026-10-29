"use client";
import { useLocale, useTranslations } from "next-intl";
import { useId, useState } from "react";
import type { AttrValue, Confidence } from "@/lib/schema";
import type { Core5 } from "@/lib/core";
import { KnowThis, CrowdLabel } from "./Crowd";
import { flags } from "@/config/flags";
import type { CrowdApplied } from "@/lib/crowd-rules";

const CONF_STYLE: Record<Confidence, string> = {
  high: "border-solid",
  medium: "border-dashed",
  low: "border-dotted",
};

/** One work attribute. Tap to see confidence, note, sources and checked date (SPEC §6.3). */
export function AttrChip({
  label,
  display,
  attr,
  crowdField,
  crowd,
}: {
  label: string;
  display: string;
  attr: AttrValue<unknown>;
  crowdField?: Core5;
  crowd?: CrowdApplied;
}) {
  const t = useTranslations();
  const locale = useLocale() as "en" | "zh";
  const [open, setOpen] = useState(false);
  const id = useId();
  const unknown = attr.value === "unknown";
  const date = new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-US", { dateStyle: "medium", timeZone: "UTC" }).format(
    new Date(attr.checkedAt),
  );

  return (
    <li className="min-w-0">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full items-baseline justify-between gap-2 rounded-lg border px-3 py-2 text-left ${
          unknown ? "border-dotted border-rule text-pencil" : `${CONF_STYLE[attr.confidence]} border-ink/30`
        } ${open ? "bg-paper-2" : "hover:bg-paper-2"}`}
      >
        <span className="text-sm text-pencil">{label}</span>
        <span className="font-medium">{unknown ? t("attr.unknown") : display}</span>
      </button>
      {crowd && crowdField && <CrowdLabel info={crowd} field={crowdField} />}
      {/* Ask on unknowns, guesses and visitor reports: more reports raise confidence (Phase 1). */}
      {crowdField && flags.crowdSingleReport && <KnowThis field={crowdField} quiet={!(unknown || crowd || attr.confidence === "low")} />}
      {crowdField && !flags.crowdSingleReport && unknown && <KnowThis field={crowdField} />}
      {open && (
        <div id={id} className="mt-1 space-y-1 rounded-lg bg-paper-2 px-3 py-2 text-sm">
          {unknown ? (
            <p>{t("spot.helpFill")}</p>
          ) : (
            <p>
              {t(`confidence.${attr.confidence}`)}
              <span className="text-pencil"> · {t(`confidence.rubric${cap(attr.confidence)}`)}</span>
            </p>
          )}
          {attr.note && <p>{attr.note[locale]}</p>}
          <p className="text-pencil">{t("spot.checked", { date })}</p>
          {attr.sources.length > 0 ? (
            <ul className="space-y-0.5">
              {attr.sources.map((s) => (
                <li key={s} className="truncate">
                  {s === "lexi" ? (
                    <span>{t("status.verifiedExplain")}</span>
                  ) : s === "community" ? (
                    <span>{t("crowd.source")}</span>
                  ) : (
                    <a href={s} target="_blank" rel="noopener noreferrer nofollow" className="text-pen underline underline-offset-2">
                      {hostname(s)}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            !unknown && <p className="text-pencil">{t("spot.noSources")}</p>
          )}
        </div>
      )}
    </li>
  );
}

function cap(s: string) {
  return s[0].toUpperCase() + s.slice(1);
}

export function hostname(u: string) {
  try {
    return new URL(u).hostname.replace(/^www\./, "");
  } catch {
    return u;
  }
}
