import { getTranslations, setRequestLocale } from "next-intl/server";
import { SubmitForm } from "@/components/SubmitForm";
import { Footer } from "@/components/Footer";

export const revalidate = 86400;

export async function generateMetadata({ params }: PageProps<"/[locale]/submit">) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "submit" });
  return { title: t("title"), description: t("lede"), alternates: { canonical: `/${locale}/submit`, languages: { en: "/en/submit", "zh-Hans": "/zh/submit" } } };
}

export default async function Submit({ params }: PageProps<"/[locale]/submit">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("submit");
  return (
    <>
      <div className="mx-auto w-full max-w-xl px-4 py-12">
        <h1 className="font-serif text-4xl">{t("title")}</h1>
        <p className="mt-2 text-pencil">{t("lede")}</p>
        <SubmitForm />
      </div>
      <Footer />
    </>
  );
}
