import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { site } from "@/config/site";

export async function Footer() {
  const t = await getTranslations("footer");
  const tn = await getTranslations("nav");
  return (
    <footer className="border-t border-rule px-4 py-6 text-sm text-pencil">
      <div className="mx-auto max-w-3xl space-y-2">
        <p>{t("data")}</p>
        <p>
          {t("builtBy", { name: site.ownerName })} · <Link href="/about" className="underline">{tn("about")}</Link> ·{" "}
          <Link href="/privacy" className="underline">{t("privacy")}</Link> ·{" "}
          <Link href="/submit" className="underline">{tn("submit")}</Link>
        </p>
      </div>
    </footer>
  );
}
