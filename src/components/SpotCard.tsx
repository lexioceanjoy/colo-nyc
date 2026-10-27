"use client";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { ClientSpot } from "@/lib/client-spot";
import { computeScore } from "@/lib/score";
import { isOpenNow } from "@/lib/hours";
import { NEIGHBORHOODS } from "@/data/neighborhoods";
import { ScoreMark } from "./ScoreMark";
import { CategoryDot } from "./CategoryDot";

export function SpotCard({
  spot,
  today,
  active,
  onHover,
}: {
  spot: ClientSpot;
  today: number;
  active?: boolean;
  onHover?: (slug: string | null) => void;
}) {
  const t = useTranslations();
  const locale = useLocale() as "en" | "zh";
  const s = computeScore(spot);
  const open = isOpenNow(spot.hours.value);
  const w = spot.work;
  const hood = NEIGHBORHOODS[spot.neighborhood][locale];

  // Up to three known, most useful facts.
  const c = t("punct.colon");
  const facts: string[] = [];
  if (w.wifi.value !== "unknown") facts.push(`${t("attr.wifi")}${c}${t(`attr.values.wifi.${w.wifi.value}`)}`);
  if (w.outlets.value !== "unknown") facts.push(`${t("attr.outlets")}${c}${t(`attr.values.outlets.${w.outlets.value}`)}`);
  if (w.laptopPolicy.value !== "unknown" && w.laptopPolicy.value !== "welcome")
    facts.unshift(`${t("attr.laptopPolicy")}${c}${t(`attr.values.laptopPolicy.${w.laptopPolicy.value}`)}`);
  if (w.noise.value !== "unknown") facts.push(t(`attr.values.noise.${w.noise.value}`));
  if (w.groupCapacity.value === "4-6" || w.groupCapacity.value === "7+")
    facts.push(t(`attr.values.groupCapacity.${w.groupCapacity.value}`));

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
            {open !== null && (
              <span className={open ? "text-ok" : ""}>{open ? t("spot.openNow") : t("spot.closedNow")}</span>
            )}
          </p>
          {facts.length > 0 && <p className="mt-1 truncate text-sm">{facts.slice(0, 3).join(t("punct.sep"))}</p>}
          <p className="mt-1 flex flex-wrap gap-2 text-xs">
            {spot.free && <span className="rounded-full bg-paper-2 px-2 py-0.5">{t("filters.free")}</span>}
            {today > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-highlight/60 px-2 py-0.5 text-ink">
                <span className="pulse inline-block size-1.5 rounded-full bg-ink" aria-hidden />
                {t("social.hereToday", { count: today })}
              </span>
            )}
          </p>
        </div>
      </Link>
    </li>
  );
}
