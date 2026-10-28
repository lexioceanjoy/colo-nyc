import "server-only";
import { ImageResponse } from "next/og";
import type { PublicSession } from "@/lib/social";
import { getSpot } from "@/lib/spots";
import { formatSessionTime } from "@/lib/hours";
import { NEIGHBORHOODS } from "@/data/neighborhoods";
import { site } from "@/config/site";
import { loadGoogleFont } from "./fonts";
import en from "../../../messages/en.json";
import zh from "../../../messages/zh.json";

/** Session invite card; 1200×630 for link previews, 1080×1440 for 小红书. */
export async function renderSessionCard(s: PublicSession, loc: "en" | "zh", size: { width: number; height: number }) {
  const m = loc === "zh" ? zh : en;
  const tall = size.height > size.width;
  const spot = getSpot(s.spot_slug);
  const where = spot ? `${spot.name} · ${NEIGHBORHOODS[spot.neighborhood][loc]}` : "";
  const when = formatSessionTime(s.starts_at, s.ends_at, loc);
  const going = m.sessions.going.replace("{going}", String(s.rsvp_count)).replace("{capacity}", String(s.capacity));
  const brand = loc === "zh" ? `${site.nameZh} · ${m.sessions.title}` : `${site.name} · ${m.sessions.title}`;
  const host = site.url.replace(/^https?:\/\//, "");
  const text = [s.title, where, when, going, brand, host, "Next Play", s.description ?? ""].join("");
  const [serif, sans] = await Promise.all([
    loadGoogleFont(loc === "zh" ? "Noto Serif SC" : "Newsreader", 500, s.title),
    loadGoogleFont(loc === "zh" ? "Noto Sans SC" : "Instrument Sans", 400, text),
  ]);
  const pad = tall ? 96 : 72;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#f7f5ef", color: "#1f2328", padding: pad, fontFamily: "Sans" }}>
        <div style={{ display: "flex", fontSize: tall ? 34 : 28, color: "#5f5e5a" }}>{brand}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: tall ? 32 : 20 }}>
          <div style={{ display: "flex", fontFamily: "Serif", fontSize: tall ? 104 : s.title.length > 40 ? 64 : 76, lineHeight: 1.1 }}>{s.title}</div>
          <div style={{ display: "flex", fontSize: tall ? 44 : 34 }}>{when}</div>
          <div style={{ display: "flex", fontSize: tall ? 44 : 34, color: "#5f5e5a" }}>{where}</div>
          {tall && s.description && <div style={{ display: "flex", fontSize: 36, lineHeight: 1.6, marginTop: 24 }}>{s.description}</div>}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "2px solid #dcd8ce", paddingTop: 24, fontSize: tall ? 36 : 30 }}>
          <span style={{ color: "#2a44c9" }}>{going}</span>
          <span style={{ color: "#5f5e5a" }}>{s.community_tag === "next_play" ? "Next Play · " : ""}{host}</span>
        </div>
      </div>
    ),
    { ...size, fonts: [{ name: "Serif", data: serif, weight: 500, style: "normal" }, { name: "Sans", data: sans, weight: 400, style: "normal" }] },
  );
}
