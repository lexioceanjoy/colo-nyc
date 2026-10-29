import { getSpot } from "@/lib/spots";
import { isListed } from "@/lib/core";
import { renderSpotCard } from "@/lib/og/spot-card";

export const runtime = "nodejs";
export const revalidate = 86400;

/** 小红书 share card: 3:4, 1080×1440, in the page's locale (SPEC §11 M4). */
export async function GET(_req: Request, { params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const spot = await getSpot(slug);
  if (!spot || !isListed(spot)) return new Response("Not found", { status: 404 });
  const img = await renderSpotCard(spot, locale === "zh" ? "zh" : "en", { width: 1080, height: 1440 });
  img.headers.set("Content-Disposition", `inline; filename="colo-${slug}-${locale}.png"`);
  return img;
}
