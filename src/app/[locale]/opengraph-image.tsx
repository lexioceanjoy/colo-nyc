import { ImageResponse } from "next/og";
import { loadGoogleFont } from "@/lib/og/fonts";
import { getVisibleSpots } from "@/lib/spots";
import { site } from "@/config/site";
import en from "../../../messages/en.json";
import zh from "../../../messages/zh.json";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Colo NYC: the best places in NYC to work, and to work together";
export const revalidate = 86400;

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "zh" }];
}

// Home link preview: the hero line, the spot count, and the score circle as the brand mark.
export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const m = locale === "zh" ? zh : en;
  const line = m.hero.line.replace(/<\/?em>/g, "");
  const count = getVisibleSpots().length;
  const sub = m.hero.sub.replace("{count}", String(count));
  const brand = locale === "zh" ? `${site.nameZh} · ${site.name}` : site.name;
  const host = site.url.replace(/^https?:\/\//, "");
  const text = [line, sub, brand, host].join("");
  const [serif, sans] = await Promise.all([
    loadGoogleFont(locale === "zh" ? "Noto Serif SC" : "Newsreader", 500, line + brand),
    loadGoogleFont(locale === "zh" ? "Noto Sans SC" : "Instrument Sans", 400, text),
  ]);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#f7f5ef", color: "#1f2328", padding: 72, fontFamily: "Sans" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ display: "flex", width: 56, height: 56, borderRadius: 999, border: "3px solid #2a44c9" }} />
          <div style={{ display: "flex", fontFamily: "Serif", fontSize: 36 }}>{brand}</div>
        </div>
        {/* CJK has no spaces to wrap on: break the zh line at its comma so words stay whole. */}
        <div style={{ display: "flex", flexDirection: "column", fontFamily: "Serif", fontSize: locale === "zh" ? 68 : 72, lineHeight: 1.15, maxWidth: 1000 }}>
          {(locale === "zh" ? line.split(/(?<=，)/) : [line]).map((part) => (
            <span key={part}>{part}</span>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 26, color: "#5f5e5a", borderTop: "2px solid #dcd8ce", paddingTop: 24 }}>
          <span style={{ maxWidth: 820 }}>{sub}</span>
          <span style={{ color: "#2a44c9" }}>{host}</span>
        </div>
      </div>
    ),
    { ...size, fonts: [{ name: "Serif", data: serif, weight: 500, style: "normal" }, { name: "Sans", data: sans, weight: 400, style: "normal" }] },
  );
}
