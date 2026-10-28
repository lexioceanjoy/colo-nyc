import { getTranslations, setRequestLocale } from "next-intl/server";
import { SessionsList } from "@/components/SessionsList";
import { Footer } from "@/components/Footer";
import { getSpotIndex } from "@/lib/spot-index";

export const revalidate = 86400;

export async function generateMetadata({ params }: PageProps<"/[locale]/sessions">) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "sessions" });
  return { title: t("title"), description: t("lede"), alternates: { canonical: `/${locale}/sessions`, languages: { en: "/en/sessions", "zh-Hans": "/zh/sessions" } } };
}

export default async function SessionsPage({ params }: PageProps<"/[locale]/sessions">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("sessions");
  return (
    <>
      <div className="mx-auto w-full max-w-2xl px-4 py-12">
        <h1 className="font-serif text-4xl">{t("title")}</h1>
        <p className="mt-2 text-pencil">{t("lede")}</p>
        <SessionsList spots={getSpotIndex()} />
      </div>
      <Footer />
    </>
  );
}
