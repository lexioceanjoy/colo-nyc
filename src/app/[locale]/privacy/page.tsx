import { setRequestLocale } from "next-intl/server";
import { Footer } from "@/components/Footer";
import { privacy, PRIVACY_UPDATED } from "@/content/privacy";
import { site } from "@/config/site";

export const revalidate = 86400;

export async function generateMetadata({ params }: PageProps<"/[locale]/privacy">) {
  const { locale } = await params;
  const c = privacy[locale === "zh" ? "zh" : "en"];
  return {
    title: c.title,
    description: c.lede.slice(0, 160),
    alternates: { canonical: `/${locale}/privacy`, languages: { en: "/en/privacy", "zh-Hans": "/zh/privacy" } },
  };
}

export default async function Privacy({ params }: PageProps<"/[locale]/privacy">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const loc = locale === "zh" ? "zh" : "en";
  const c = privacy[loc];
  const date = new Intl.DateTimeFormat(loc === "zh" ? "zh-CN" : "en-US", { dateStyle: "long", timeZone: "UTC" }).format(new Date(PRIVACY_UPDATED));
  return (
    <>
      <article className="mx-auto w-full max-w-2xl px-4 py-12">
        <h1 className="font-serif text-4xl">{c.title}</h1>
        <p className="mt-2 text-sm text-pencil">
          {c.updated}<time dateTime={PRIVACY_UPDATED}>{date}</time>
        </p>
        <p className="mt-5 text-lg leading-relaxed">{c.lede}</p>
        {c.sections.map((s) => (
          <section key={s.title} className="mt-10">
            <h2 className="font-serif text-2xl">{s.title}</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 leading-relaxed">
              {s.items.map((i) => (
                <li key={i.slice(0, 32)}>{i}</li>
              ))}
            </ul>
          </section>
        ))}
        <section className="mt-10" id="contact">
          <h2 className="font-serif text-2xl">{c.contactTitle}</h2>
          <p className="mt-3">
            {c.contact}{" "}
            <a href={`mailto:${site.contactEmail}`} className="text-pen underline underline-offset-2">
              {site.contactEmail}
            </a>
          </p>
        </section>
      </article>
      <Footer />
    </>
  );
}
