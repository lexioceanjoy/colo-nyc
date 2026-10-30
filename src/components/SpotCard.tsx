"use client";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { ClientSpot } from "@/lib/client-spot";
import { computeScore } from "@/lib/score";
import { isOpenNow } from "@/lib/hours";
import { NEIGHBORHOODS } from "@/data/neighborhoods";
import { matchesFlag, type FlagFilter } from "@/lib/filters";

// Priority order for card chips (time- and social-dependent flags are shown elsewhere).
const CARD_FLAGS: FlagFilter[] = ["wifi", "outlets", "quiet", "group", "free", "calls", "weekend", "nolimit"];
import { ScoreMark } from "./ScoreMark";
import { CategoryDot } from "./CategoryDot";

export function SpotCard({
  spot,
  today,
  active,
  onHover,
  walk,
  nudge,
}: {
  spot: ClientSpot;
  today: number;
  active?: boolean;
  onHover?: (slug: string | null) => void;
  /** Phase 3: "0.3 mi · 6 min walk" when the user shared location. */
  walk?: string;
  /** Phase 3: within ~75 m → suggest checking in. */
  nudge?: boolean;
}) {
  const t = useTranslations();
  const locale = useLocale() as "en" | "zh";
  const s = computeScore(spot);
  const open = isOpenNow(spot.hours.value);
  const hood = NEIGHBORHOODS[spot.neighborhood][locale];

  // Top 5 filterable attributes this spot actually has, labeled exactly like the filter chips.
  const chips = CARD_FLAGS.filter((f) => matchesFlag(spot, f)).slice(0, 5);

  return (
    <li
      data-slug={spot.slug}
      onMouseEnter={() => onHover?.(spot.slug)}
      onMouseLeave={() => onHover?.(null)}
      className={`border-b border-rule transition-colors ${active ? "bg-pen-soft" : "hover:bg-paper-2"}`}
    >
      <Link href={`/spot/${spot.slug}`} className="flex gap-3 px-4 py-4 focus-visible:outline-offset-[-2px]">
        <ScoreMark score={s.score} confidence={s.confidence} label={`${t("score.label")} ${s.score}/10`} />
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-serif text-lg leading-snug">{spot.name}</h3>
          <p className="flex flex-wrap items-center gap-x-2 text-sm text-pencil">
            <CategoryDot category={spot.category} />
            <span>{t(`category.${spot.category}`)}</span>
            <span aria-hidden>/</span>
            <span>{hood}</span>
            {open === null ? (
              <span>{t("spot.hoursUnverified")}</span>
            ) : (
              <span className={open ? "text-ok" : ""}>{open ? t("spot.openNow") : t("spot.closedNow")}</span>
            )}
          </p>
          {walk && (
            <p className="mt-0.5 text-sm tabular-nums text-ink" data-testid="card-walk">
              {walk}
            </p>
          )}
          <p className="mt-2 flex flex-wrap gap-1.5 text-xs" data-testid="card-chips">
            {chips.map((f) => (
              <span key={f} className="rounded-full border border-rule px-2 py-0.5">
                {t(`filters.${f}`)}
              </span>
            ))}
            {today > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-highlight/60 px-2 py-0.5 text-ink">
                <span className="pulse inline-block size-1.5 rounded-full bg-ink" aria-hidden />
                {t("social.hereToday", { count: today })}
              </span>
            )}
          </p>
        </div>
      </Link>
      {nudge && (
        <Link href={`/spot/${spot.slug}#checkin`} className="mx-4 mb-3 -mt-1 block rounded-lg bg-highlight/50 px-3 py-2 text-sm" data-testid="card-nudge">
          {t("near.nudge", { spot: spot.name })}
        </Link>
      )}
    </li>
  );
}
