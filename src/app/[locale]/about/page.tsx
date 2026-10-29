import { getTranslations, setRequestLocale } from "next-intl/server";
import { Footer } from "@/components/Footer";
import { about, AGENT_COUNT } from "@/content/about";
import { getExcluded, type ExcludedKind } from "@/lib/excluded";
import { getStats } from "@/lib/stats";

export const revalidate = 86400;

export async function generateMetadata({ params }: PageProps<"/[locale]/about">) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });
  return {
    title: t("title"),
    description: about[locale === "zh" ? "zh" : "en"].lede.slice(0, 160),
    alternates: { canonical: `/${locale}/about`, languages: { en: "/en/about", "zh-Hans": "/zh/about" } },
  };
}

const RUBRIC_DASH = { high: undefined, medium: "10 3", low: "4 5" } as const;

export default async function About({ params }: PageProps<"/[locale]/about">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const loc = locale === "zh" ? "zh" : "en";
  const c = about[loc];
  const stats = await getStats();
  const excluded = getExcluded();
  const kinds: ExcludedKind[] = ["closed", "laptops", "other", "paid"];

  return (
    <>
      <article className="mx-auto w-full max-w-2xl px-4 py-12">
        <h1 className="font-serif text-4xl leading-tight sm:text-5xl">{c.title}</h1>
        <p className="mt-5 font-serif text-xl leading-relaxed">{c.lede}</p>

        <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-4 border-y border-rule py-6 sm:grid-cols-4">
          {[
            [stats.spots, c.stats.spots],
            [stats.sources, c.stats.sources],
            [`${stats.knownPct}%`, c.stats.known],
            [AGENT_COUNT, c.stats.agents],
          ].map(([n, label]) => (
            <div key={String(label)}>
              <dt className="sr-only">{label}</dt>
              <dd className="font-serif text-3xl text-pen tabular-nums">{n}</dd>
              <dd className="text-sm text-pencil">{label}</dd>
            </div>
          ))}
        </dl>

        {c.sections.map((s) => (
          <section key={s.title} className="mt-10">
            <h2 className="font-serif text-2xl">{s.title}</h2>
            {s.body.map((p) => (
              <p key={p.slice(0, 24)} className="mt-3 leading-relaxed">
                {p}
              </p>
            ))}
          </section>
        ))}

        <section className="mt-10">
          <h2 className="font-serif text-2xl">{c.rubricTitle}</h2>
          <ul className="mt-3 space-y-3">
            {c.rubric.map((r) => (
              <li key={r.level} className="flex items-start gap-3">
                <svg viewBox="0 0 24 24" className="mt-0.5 size-6 shrink-0 text-pen" aria-hidden>
                  <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.6" strokeDasharray={RUBRIC_DASH[r.level]} />
                </svg>
                <span>{r.text}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-10">
          <h2 className="font-serif text-2xl">{c.timelineTitle}</h2>
          <ol className="mt-3 border-l border-rule">
            {c.timeline.map((s) => (
              <li key={s.when} className="relative pb-5 pl-5">
                <span className="absolute -left-[5px] top-1.5 size-2.5 rounded-full bg-pen" aria-hidden />
                <p className="text-sm text-pencil">{s.when}</p>
                <p>{s.what}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-10">
          <h2 className="font-serif text-2xl">{c.excludedTitle}</h2>
          <p className="mt-3">{c.excludedIntro}</p>
          {kinds.map((k) => {
            const items = excluded.filter((e) => e.kind === k);
            if (!items.length) return null;
            return (
              <details key={k} className="mt-4 rounded-xl border border-rule p-4">
                <summary className="cursor-pointer font-medium">
                  {c.excludedKinds[k]} <span className="text-pencil">({items.length})</span>
                </summary>
                <ul className="mt-2 space-y-1 text-sm">
                  {items.map((e) => (
                    <li key={e.name}>
                      <span className="font-medium">{e.name}</span>
                      {loc === "en" && <span className="text-pencil">: {e.reason}</span>}
                    </li>
                  ))}
                </ul>
              </details>
            );
          })}
        </section>

        <section className="mt-10">
          <h2 className="font-serif text-2xl">{c.creditsTitle}</h2>
          <ul className="mt-3 space-y-2">
            {c.credits.map((p) => (
              <li key={p.slice(0, 24)}>{p}</li>
            ))}
          </ul>
          <p className="mt-6 text-sm text-pencil">{c.desk}</p>
        </section>
      </article>
      <Footer />
    </>
  );
}
