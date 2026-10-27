import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function NotFound() {
  const t = await getTranslations("notFound");
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="font-serif text-4xl">{t("title")}</h1>
      <p className="mt-3 text-pencil">{t("body")}</p>
      <Link href="/" className="mt-8 inline-block rounded-full bg-pen px-5 py-2.5 text-paper">
        {t("home")}
      </Link>
    </div>
  );
}
