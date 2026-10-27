import { getTranslations } from "next-intl/server";
import { getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { site } from "@/config/site";
import { LocaleToggle } from "./LocaleToggle";
import { TodayCount } from "./TodayCount";

export async function Header() {
  const t = await getTranslations("nav");
  const locale = await getLocale();
  return (
    <header className="sticky top-0 z-30 border-b border-rule bg-paper/95 backdrop-blur supports-[backdrop-filter]:bg-paper/80">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 bg-paper px-2 py-1">
        {t("skip")}
      </a>
      <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-3 px-4">
        <Link href="/" className="flex items-baseline gap-2 font-serif text-[1.35rem] leading-none tracking-tight">
          <span>{site.name}</span>
          {locale === "zh" && <span className="hidden font-sans text-sm text-pencil sm:inline">{site.nameZh}</span>}
        </Link>
        <nav className="ml-auto flex items-center gap-1 text-sm">
          <TodayCount label={t("today")} />
          <Link href="/about" className="hidden rounded-full px-3 py-1.5 hover:bg-paper-2 sm:inline-block">
            {t("about")}
          </Link>
          <LocaleToggle label={t("language")} ariaLabel={t("languageLabel")} />
        </nav>
      </div>
    </header>
  );
}
