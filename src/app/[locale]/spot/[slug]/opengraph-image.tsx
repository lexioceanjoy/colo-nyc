import { notFound } from "next/navigation";
import { getSpot } from "@/lib/spots";
import { renderSpotCard } from "@/lib/og/spot-card";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Colo NYC spot card";

// Rendered on first request, then cached (ISR) — keeps builds fast with ~250 locale×spot images.
export const revalidate = 86400;
export function generateStaticParams() {
  return [];
}

export default async function Image({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const spot = getSpot(slug);
  if (!spot) notFound();
  return renderSpotCard(spot, locale === "zh" ? "zh" : "en", size);
}
