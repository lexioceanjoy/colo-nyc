"use client";
import { useTranslations } from "next-intl";
import { useTodayCounts } from "@/lib/social";

// Social block. Anonymous visitors only ever see counts (SPEC §7). Full flow lands in M3.
export function SpotSocial({ slug }: { slug: string }) {
  const t = useTranslations("social");
  const { counts, ready } = useTodayCounts();
  const n = counts[slug] ?? 0;
  return (
    <section className="mt-8 rounded-xl border border-rule p-4" aria-live="polite" data-testid="spot-social">
      <p className="flex items-center gap-2 font-serif text-xl">
        <span className={`inline-block size-2.5 rounded-full bg-highlight ${n > 0 ? "pulse" : "opacity-50"}`} aria-hidden />
        {t("hereToday", { count: n })}
      </p>
      {!ready && <p className="mt-1 text-sm text-pencil">{t("comingSoon")}</p>}
    </section>
  );
}
