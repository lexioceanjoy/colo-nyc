import { notFound } from "next/navigation";
import { getPublicSession } from "@/lib/sessions-server";
import { renderSessionCard } from "@/lib/og/session-card";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Cowork session invite";
export const revalidate = 60;

// The invite card people see when a session link is dropped in Slack (SPEC §6.5).
export default async function Image({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  const s = await getPublicSession(id);
  if (!s) notFound();
  return renderSessionCard(s, locale === "zh" ? "zh" : "en", size);
}
