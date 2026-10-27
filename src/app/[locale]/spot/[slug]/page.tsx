import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { getSpot, getVisibleSpots, getMapCoords } from "@/lib/spots";
import { computeScore } from "@/lib/score";
import { rangesForDay, formatTime } from "@/lib/hours";
import type { WorkAttrKey } from "@/lib/schema";
import { NEIGHBORHOODS } from "@/data/neighborhoods";
import { site } from "@/config/site";
import { googleMapsUrl } from "@/lib/links";
import { ScoreMark } from "@/components/ScoreMark";
import { CategoryDot } from "@/components/CategoryDot";
import { AttrChip } from "@/components/AttrChip";
import { OpenNow } from "@/components/OpenNow";
import { SpotMiniMap } from "@/components/SpotMiniMap";
import { SpotSocial } from "@/components/SpotSocial";
import { Footer } from "@/components/Footer";

export const revalidate = 86400;
export const dynamicParams = false;

export function generateStaticParams() {
  return routing.locales.flatMap((locale) => getVisibleSpots().map((s) => ({ locale, slug: s.slug })));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/spot/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  const spot = getSpot(slug);
  if (!spot) return {};
  const t = await getTranslations({ locale });
  const loc = locale as "en" | "zh";
  const { score } = computeScore(spot);
  return {
    title: t("meta.spotTitle", { name: spot.name, score: score.toFixed(1) }),
    description: spot.blurb[loc] || t("meta.spotDescription", { category: t(`category.${spot.category}`), neighborhood: NEIGHBORHOODS[spot.neighborhood][loc] }),
    alternates: {
      canonical: `/${locale}/spot/${slug}`,
      languages: { en: `/en/spot/${slug}`, "zh-Hans": `/zh/spot/${slug}` },
    },
  };
}

export default async function SpotPage({ params }: PageProps<"/[locale]/spot/[slug]">) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const spot = getSpot(slug);
  if (!spot || spot.closed) notFound();
  const loc = locale as "en" | "zh";
  const t = await getTranslations();
  const s = computeScore(spot);
  const coords = (await getMapCoords([spot]))[spot.slug];
  const w = spot.work;
  const fmtDate = (d: string) =>
    new Intl.DateTimeFormat(loc === "zh" ? "zh-CN" : "en-US", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(d));

  const display = (k: WorkAttrKey): string => {
    const v = w[k].value;
    if (v === "unknown") return t("attr.unknown");
    switch (k) {
      case "timeLimitMin":
        return v === null ? t("attr.noLimit") : t("attr.minutes", { n: v as number });
      case "callsOk":
        return v ? t("attr.callsYes") : t("attr.callsNo");
      case "bookableSpace":
        return v ? t("attr.bookableYes") : t("attr.bookableNo");
      default:
        return t(`attr.values.${k}.${String(v)}`);
    }
  };
  const attrOrder: WorkAttrKey[] = ["wifi", "outlets", "seating", "noise", "laptopPolicy", "timeLimitMin", "callsOk", "groupCapacity", "bookableSpace", "restroom"];
  const days = t.raw("spot.days") as string[];
  const hours = spot.hours.value;

  return (
    <>
      <article className="mx-auto w-full max-w-3xl px-4 pb-16 pt-6">
        <Link href="/" className="text-sm text-pen hover:underline">
          ← {t("spot.back")}
        </Link>

        <header className="mt-4 flex items-start gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="font-serif text-4xl leading-tight">{spot.name}</h1>
            {spot.nameZh && loc === "zh" && <p className="text-pencil">{spot.nameZh}</p>}
            <p className="mt-2 flex flex-wrap items-center gap-x-2 text-pencil">
              <CategoryDot category={spot.category} />
              <span>{t(`category.${spot.category}`)}</span>
              <span aria-hidden>/</span>
              <span>{NEIGHBORHOODS[spot.neighborhood][loc]}</span>
              <span aria-hidden>/</span>
              <span>{spot.free ? t("spot.free") : t("spot.purchase")}</span>
            </p>
            <p className="mt-2 text-sm">
              <span className={`rounded-full px-2 py-0.5 ${spot.status === "verified" ? "bg-ok/15 text-ok" : "bg-paper-2"}`} title={spot.status === "verified" ? t("status.verifiedExplain") : t("status.aiExplain")}>
                {spot.status === "verified" ? t("status.verified", { name: spot.verifiedBy ?? site.ownerName }) : t("status.ai_researched")}
              </span>
            </p>
          </div>
          <ScoreMark size="lg" score={s.score} confidence={s.confidence} label={`${t("score.label")} ${s.score}/10`} />
        </header>

        <p className="mt-6 font-serif text-xl leading-relaxed">{spot.blurb[loc]}</p>

        <section className="mt-8" aria-labelledby="gotchas">
          <h2 id="gotchas" className="font-serif text-2xl">{t("spot.gotchas")}</h2>
          {spot.gotchas[loc].length ? (
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {spot.gotchas[loc].map((g) => (
                <li key={g}>{g}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-pencil">{t("spot.noGotchas")}</p>
          )}
          {w.busyTimes && (
            <p className="mt-3">
              <span className="text-pencil">{t("spot.busy")}{t("punct.colon")}</span>
              {w.busyTimes[loc]}
            </p>
          )}
        </section>

        <section className="mt-8" aria-labelledby="score">
          <details className="group rounded-xl border border-rule p-4" open>
            <summary id="score" className="cursor-pointer font-serif text-2xl">
              {t("score.breakdown")}
            </summary>
            <table className="mt-3 w-full text-sm" data-testid="score-breakdown">
              <tbody>
                {s.lines.map((l) => (
                  <tr key={l.key} className="border-t border-rule">
                    <th scope="row" className="py-1.5 text-left font-normal">
                      {t(`attr.${l.key}`)} <span className="text-pencil">({Math.round(l.weight * 100)}%)</span>
                    </th>
                    <td className="py-1.5 text-pencil">{l.unknown ? t("attr.unknown") : display(l.key)}</td>
                    <td className="w-32 py-1.5">
                      <span className="block h-1.5 rounded-full bg-paper-2">
                        <span className={`block h-full rounded-full ${l.unknown ? "bg-rule" : "bg-pen"}`} style={{ width: `${l.factor * 100}%` }} />
                      </span>
                    </td>
                    <td className="py-1.5 text-right tabular-nums">{t("score.points", { points: l.points.toFixed(1), max: l.max.toFixed(1) })}</td>
                  </tr>
                ))}
                <tr className="border-t border-ink/40 font-medium">
                  <th scope="row" className="py-1.5 text-left">{t("score.label")}</th>
                  <td />
                  <td />
                  <td className="py-1.5 text-right tabular-nums">{s.score.toFixed(1)} / 10</td>
                </tr>
              </tbody>
            </table>
            <p className="mt-2 text-sm text-pencil">
              {t(`confidence.${s.confidence}`)}
              {t("punct.period").trim()} {s.unknownCount > 0 && t("score.unknownNote")}
            </p>
          </details>
        </section>

        <section className="mt-8" aria-labelledby="details">
          <h2 id="details" className="font-serif text-2xl">{t("spot.details")}</h2>
          <p className="text-sm text-pencil">{t("spot.tapForSource")}</p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {attrOrder.map((k) => (
              <AttrChip key={k} label={t(`attr.${k}`)} display={display(k)} attr={w[k]} />
            ))}
          </ul>
        </section>

        {spot.bestFor.length > 0 && (
          <section className="mt-8">
            <h2 className="font-serif text-2xl">{t("spot.bestFor")}</h2>
            <p className="mt-2 flex flex-wrap gap-2">
              {spot.bestFor.map((b) => (
                <span key={b} className="rounded-full bg-pen-soft px-3 py-1 text-sm">{t(`bestFor.${b}`)}</span>
              ))}
            </p>
          </section>
        )}

        <section className="mt-8" aria-labelledby="hours">
          <h2 id="hours" className="flex items-baseline gap-3 font-serif text-2xl">
            {t("attr.hours")} <OpenNow hours={hours} />
          </h2>
          {hours === "unknown" ? (
            <p className="mt-2 text-pencil">{t("spot.helpFill")}</p>
          ) : (
            <table className="mt-2 text-sm">
              <tbody>
                {[1, 2, 3, 4, 5, 6, 0].map((d) => {
                  const r = rangesForDay(hours, d);
                  return (
                    <tr key={d}>
                      <th scope="row" className="pr-6 text-left font-normal text-pencil">{days[d]}</th>
                      <td>{r.length ? r.map((x) => `${formatTime(x.open, loc)}–${formatTime(x.close, loc)}`).join(", ") : t("spot.closedDay")}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          <p className="mt-1 text-xs text-pencil">{t("spot.hoursNote", { date: fmtDate(spot.hours.checkedAt) })}</p>
        </section>

        <SpotSocial slug={spot.slug} />

        <section className="mt-8 space-y-3">
          <p>
            <span className="text-pencil">{t("spot.address")}{t("punct.colon")}</span>
            {spot.address}
          </p>
          {coords && <SpotMiniMap center={coords} name={spot.name} />}
          <p className="flex flex-wrap gap-3">
            <a href={googleMapsUrl(spot)} target="_blank" rel="noopener noreferrer" className="rounded-full border border-rule px-4 py-2 hover:border-pen">
              {t("spot.openInGoogle")}
            </a>
            {spot.website && (
              <a href={spot.website} target="_blank" rel="noopener noreferrer" className="rounded-full border border-rule px-4 py-2 hover:border-pen">
                {t("spot.website")}
              </a>
            )}
          </p>
        </section>
      </article>
      <Footer />
    </>
  );
}
