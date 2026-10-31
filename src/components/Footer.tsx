import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { site } from "@/config/site";

export async function Footer() {
  const t = await getTranslations("footer");
  const tn = await getTranslations("nav");
  return (
    <footer className="border-t border-rule px-4 py-6 text-sm text-pencil">
      <div className="mx-auto max-w-3xl space-y-2">
        <p>{t.rich("data", { nw: (chunks) => <span className="whitespace-nowrap">{chunks}</span> })}</p>
        <p data-testid="footer-osm">
          {t.rich("osm", {
            osm: (chunks) => (
              <a href="https://www.openstreetmap.org/copyright" className="whitespace-nowrap underline">
                {chunks}
              </a>
            ),
          })}
        </p>
        <p>
          {t("builtBy", { name: site.ownerName })} · <Link href="/about" className="whitespace-nowrap underline">{tn("about")}</Link> ·{" "}
          <Link href="/privacy" className="whitespace-nowrap underline">{t("privacy")}</Link> ·{" "}
          <Link href="/submit" className="whitespace-nowrap underline">{tn("submit")}</Link>
        </p>
      </div>
    </footer>
  );
}
