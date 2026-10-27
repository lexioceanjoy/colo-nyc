import { getTranslations, setRequestLocale } from "next-intl/server";
import { Footer } from "@/components/Footer";

export const revalidate = 86400;

export async function generateMetadata({ params }: PageProps<"/[locale]/about">) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });
  return { title: t("title"), alternates: { canonical: `/${locale}/about`, languages: { en: "/en/about", "zh-Hans": "/zh/about" } } };
}

export default async function About({ params }: PageProps<"/[locale]/about">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("about");
  return (
    <>
      <article className="mx-auto w-full max-w-2xl px-4 py-12">
        <h1 className="font-serif text-4xl">{t("title")}</h1>
        <p className="mt-4 text-pencil">{t("draft")}</p>
      </article>
      <Footer />
    </>
  );
}
