import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getPublicSession } from "@/lib/sessions-server";
import { getSpot } from "@/lib/spots";
import { formatSessionTime } from "@/lib/hours";
import { NEIGHBORHOODS } from "@/data/neighborhoods";
import { SessionDetail } from "@/components/SessionDetail";
import { Footer } from "@/components/Footer";

// Share pages are the invite link people paste into Slack: server-rendered for previews, refreshed every minute.
export const revalidate = 60;

export async function generateMetadata({ params }: PageProps<"/[locale]/sessions/[id]">): Promise<Metadata> {
  const { locale, id } = await params;
  const s = await getPublicSession(id);
  if (!s) return {};
  const spot = getSpot(s.spot_slug);
  const t = await getTranslations({ locale, namespace: "sessions" });
  return {
    title: s.title,
    description: `${formatSessionTime(s.starts_at, s.ends_at, locale)} · ${spot?.name ?? ""} · ${t("going", { going: s.rsvp_count, capacity: s.capacity })}`,
    alternates: { canonical: `/${locale}/sessions/${id}`, languages: { en: `/en/sessions/${id}`, "zh-Hans": `/zh/sessions/${id}` } },
    robots: { index: false },
  };
}

export default async function SessionPage({ params }: PageProps<"/[locale]/sessions/[id]">) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const s = await getPublicSession(id);
  if (!s) notFound();
  const spot = getSpot(s.spot_slug);
  const loc = locale === "zh" ? "zh" : "en";
  return (
    <>
      <SessionDetail
        initial={s}
        spot={spot ? { slug: spot.slug, name: spot.name, hood: NEIGHBORHOODS[spot.neighborhood][loc], address: spot.address } : null}
      />
      <Footer />
    </>
  );
}
