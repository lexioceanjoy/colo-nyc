import { setRequestLocale } from "next-intl/server";
import { Footer } from "@/components/Footer";
import { about } from "@/content/about";
import { site } from "@/config/site";
import { Link } from "@/i18n/navigation";

export const revalidate = 86400;

export async function generateMetadata({ params }: PageProps<"/[locale]/about">) {
  const { locale } = await params;
  const c = about[locale === "zh" ? "zh" : "en"];
  return {
    title: c.title,
    description: c.what,
    alternates: { canonical: `/${locale}/about`, languages: { en: "/en/about", "zh-Hans": "/zh/about" } },
  };
}

export default async function About({ params }: PageProps<"/[locale]/about">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const c = about[locale === "zh" ? "zh" : "en"];

  return (
    <>
      <article className="mx-auto w-full max-w-2xl space-y-4 px-4 py-12 leading-relaxed" data-testid="about">
        <h1 className="font-serif text-4xl leading-tight">{c.title}</h1>
        {/* zh: break only at punctuation so no word (地图) splits and no char orphans */}
        <p className={`font-serif text-xl text-balance ${locale === "zh" ? "break-keep" : ""}`}>{c.what}</p>
        <p>{c.how}</p>
        <p>
          <Link href="/submit" className="text-pen underline">
            {c.suggest} →
          </Link>
        </p>
        <p className="text-sm text-pencil" data-testid="about-credits">
          <a href="https://www.openstreetmap.org/copyright" className="whitespace-nowrap underline">{c.credits.osm}</a> · {c.credits.google} ·{" "}
          <a href={`${site.repo}/blob/main/LICENSE-DATA`} className="whitespace-nowrap underline">{c.credits.license}</a>
        </p>
        <p className="text-sm">
          <Link href="/privacy" className="underline">{c.privacy}</Link> ·{" "}
          <a href={site.repo} className="underline">GitHub</a>
        </p>
      </article>
      <Footer />
    </>
  );
}
