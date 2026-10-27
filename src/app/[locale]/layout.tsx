import type { Metadata, Viewport } from "next";
import { Newsreader, Instrument_Sans, Noto_Sans_SC } from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Analytics } from "@vercel/analytics/next";
import { routing } from "@/i18n/routing";
import { site } from "@/config/site";
import { Header } from "@/components/Header";
import "../globals.css";

const display = Newsreader({ subsets: ["latin"], variable: "--font-display", style: ["normal", "italic"], display: "swap" });
const ui = Instrument_Sans({ subsets: ["latin"], variable: "--font-ui", display: "swap" });
const zh = Noto_Sans_SC({ weight: ["400", "500", "700"], variable: "--font-zh", display: "swap", preload: false });

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    metadataBase: new URL(site.url),
    title: { default: t("title"), template: `%s · ${locale === "zh" ? site.nameZh : site.name}` },
    description: t("description"),
    alternates: { canonical: `/${locale}`, languages: { en: "/en", "zh-Hans": "/zh", "x-default": "/en" } },
    openGraph: { siteName: site.name, locale: locale === "zh" ? "zh_CN" : "en_US", type: "website" },
    twitter: { card: "summary_large_image" },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f5ef" },
    { media: "(prefers-color-scheme: dark)", color: "#15171c" },
  ],
};

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <html lang={locale === "zh" ? "zh-Hans" : "en"} className={`${display.variable} ${ui.variable} ${zh.variable}`}>
      <body className="min-h-dvh flex flex-col">
        <NextIntlClientProvider>
          <Header />
          <main id="main" className="flex-1 flex flex-col">
            {children}
          </main>
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  );
}
