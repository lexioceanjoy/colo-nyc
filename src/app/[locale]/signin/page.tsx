import { getTranslations, setRequestLocale } from "next-intl/server";
import { SignInPanel } from "@/components/SignInPanel";

export const revalidate = 86400;

export async function generateMetadata({ params }: PageProps<"/[locale]/signin">) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });
  return { title: t("title"), robots: { index: false } };
}

export default async function SignIn({ params }: PageProps<"/[locale]/signin">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <div className="mx-auto w-full max-w-md px-4 py-16">
      <SignInPanel />
    </div>
  );
}
