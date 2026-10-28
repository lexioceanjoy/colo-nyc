import { getPublicSession } from "@/lib/sessions-server";
import { renderSessionCard } from "@/lib/og/session-card";

export const runtime = "nodejs";
export const revalidate = 60;

/** 小红书 share card for a session: 3:4, 1080×1440. */
export async function GET(_req: Request, { params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  const s = await getPublicSession(id);
  if (!s) return new Response("Not found", { status: 404 });
  const img = await renderSessionCard(s, locale === "zh" ? "zh" : "en", { width: 1080, height: 1440 });
  img.headers.set("Content-Disposition", `inline; filename="colo-session-${id.slice(0, 8)}-${locale}.png"`);
  return img;
}
