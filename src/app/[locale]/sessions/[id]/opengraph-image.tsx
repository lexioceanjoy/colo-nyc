import { ImageResponse } from "next/og";
import { notFound } from "next/navigation";
import { getPublicSession } from "@/lib/sessions-server";
import { getSpot } from "@/lib/spots";
import { formatSessionTime } from "@/lib/hours";
import { loadGoogleFont } from "@/lib/og/fonts";
import { NEIGHBORHOODS } from "@/data/neighborhoods";
import { site } from "@/config/site";
import en from "../../../../../messages/en.json";
import zh from "../../../../../messages/zh.json";

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
  const loc = locale === "zh" ? "zh" : "en";
  const m = loc === "zh" ? zh : en;
  const spot = getSpot(s.spot_slug);
  const where = spot ? `${spot.name} · ${NEIGHBORHOODS[spot.neighborhood][loc]}` : "";
  const when = formatSessionTime(s.starts_at, s.ends_at, loc);
  const going = m.sessions.going.replace("{going}", String(s.rsvp_count)).replace("{capacity}", String(s.capacity));
  const brand = loc === "zh" ? `${site.nameZh} · ${m.sessions.title}` : `${site.name} · ${m.sessions.title}`;
  const text = [s.title, where, when, going, brand, "Next Play"].join("");
  const [serif, sans] = await Promise.all([
    loadGoogleFont(loc === "zh" ? "Noto Serif SC" : "Newsreader", 500, s.title),
    loadGoogleFont(loc === "zh" ? "Noto Sans SC" : "Instrument Sans", 400, text),
  ]);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#f7f5ef", color: "#1f2328", padding: 72, fontFamily: "Sans" }}>
        <div style={{ display: "flex", fontSize: 28, color: "#5f5e5a" }}>{brand}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", fontFamily: "Serif", fontSize: s.title.length > 40 ? 64 : 76, lineHeight: 1.1 }}>{s.title}</div>
          <div style={{ display: "flex", fontSize: 34 }}>{when}</div>
          <div style={{ display: "flex", fontSize: 34, color: "#5f5e5a" }}>{where}</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "2px solid #dcd8ce", paddingTop: 24, fontSize: 30 }}>
          <span style={{ color: "#2a44c9" }}>{going}</span>
          {s.community_tag === "next_play" && <span style={{ border: "2px solid #2a44c9", borderRadius: 999, padding: "4px 16px", color: "#2a44c9" }}>Next Play</span>}
        </div>
      </div>
    ),
    { ...size, fonts: [{ name: "Serif", data: serif, weight: 500, style: "normal" }, { name: "Sans", data: sans, weight: 400, style: "normal" }] },
  );
}
