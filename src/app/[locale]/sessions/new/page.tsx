import { getTranslations, setRequestLocale } from "next-intl/server";
import { HostForm } from "@/components/HostForm";
import { getSpotIndex } from "@/lib/spot-index";

export const revalidate = 86400;

export async function generateMetadata({ params }: PageProps<"/[locale]/sessions/new">) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "sessions" });
  return { title: t("host"), robots: { index: false } };
}

export default async function NewSession({ params }: PageProps<"/[locale]/sessions/new">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <div className="mx-auto w-full max-w-xl px-4 py-12">
      <HostForm spots={await getSpotIndex()} />
    </div>
  );
}
