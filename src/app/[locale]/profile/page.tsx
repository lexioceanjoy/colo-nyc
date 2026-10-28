import { getTranslations, setRequestLocale } from "next-intl/server";
import { ProfileForm } from "@/components/ProfileForm";

export const revalidate = 86400;

export async function generateMetadata({ params }: PageProps<"/[locale]/profile">) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "profile" });
  return { title: t("title"), robots: { index: false } };
}

export default async function ProfilePage({ params }: PageProps<"/[locale]/profile">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <div className="mx-auto w-full max-w-xl px-4 py-12">
      <ProfileForm />
    </div>
  );
}
