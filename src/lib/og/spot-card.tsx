import "server-only";
import { ImageResponse } from "next/og";
import type { Spot } from "@/lib/schema";
import { computeScore } from "@/lib/score";
import { NEIGHBORHOODS } from "@/data/neighborhoods";
import { site } from "@/config/site";
import { loadGoogleFont } from "./fonts";
import en from "../../../messages/en.json";
import zh from "../../../messages/zh.json";

type Loc = "en" | "zh";
const M = { en, zh } as const;

/** Top known attributes as short labels, e.g. "Wi-Fi: Strong". */
export function topAttributes(spot: Spot, loc: Loc, n = 3): string[] {
  const m = M[loc];
  const colon = m.punct.colon;
  const w = spot.work;
  const out: string[] = [];
  const v = m.attr.values;
  if (w.wifi.value !== "unknown") out.push(`${m.attr.wifi}${colon}${v.wifi[w.wifi.value]}`);
  if (w.outlets.value !== "unknown") out.push(`${m.attr.outlets}${colon}${v.outlets[w.outlets.value]}`);
  if (w.noise.value !== "unknown") out.push(`${m.attr.noise}${colon}${v.noise[w.noise.value]}`);
  if (w.groupCapacity.value === "4-6" || w.groupCapacity.value === "7+") out.push(`${m.attr.groupCapacity}${colon}${v.groupCapacity[w.groupCapacity.value]}`);
  if (w.laptopPolicy.value !== "unknown") out.push(`${m.attr.laptopPolicy}${colon}${v.laptopPolicy[w.laptopPolicy.value]}`);
  return out.slice(0, n);
}

const C = { paper: "#f7f5ef", ink: "#1f2328", pencil: "#5f5e5a", pen: "#2a44c9", rule: "#dcd8ce" };

/** Shared renderer for link previews (1200×630) and the 小红书 share card (1080×1440). */
export async function renderSpotCard(spot: Spot, loc: Loc, size: { width: number; height: number }) {
  const m = M[loc];
  const { score } = computeScore(spot);
  const hood = NEIGHBORHOODS[spot.neighborhood][loc];
  const category = m.category[spot.category];
  const attrs = topAttributes(spot, loc, size.height > size.width ? 4 : 3);
  const brand = loc === "zh" ? `${site.nameZh} · ${site.name}` : site.name;
  const host = site.url.replace(/^https?:\/\//, "");
  const tall = size.height > size.width;
  const blurb = tall ? spot.blurb[loc] : "";

  const allText = [spot.name, hood, category, ...attrs, brand, host, m.score.label, score.toFixed(1), "/10", blurb].join("");
  const [serif, sans, sansBold] = await Promise.all([
    loadGoogleFont("Newsreader", 500, `${spot.name}${score.toFixed(1)}0123456789./`),
    loadGoogleFont(loc === "zh" ? "Noto Sans SC" : "Instrument Sans", 400, allText),
    loadGoogleFont(loc === "zh" ? "Noto Sans SC" : "Instrument Sans", 700, allText),
  ]);

  const pad = tall ? 96 : 72;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: C.paper, color: C.ink, padding: pad, fontFamily: "Sans" }}>
        <div style={{ display: "flex", fontSize: tall ? 34 : 26, color: C.pencil }}>{brand}</div>
        <div style={{ display: "flex", flexDirection: tall ? "column" : "row", flex: 1, marginTop: tall ? 80 : 40, gap: tall ? 56 : 48, alignItems: tall ? "flex-start" : "center" }}>
          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <div style={{ fontFamily: "Serif", fontSize: tall ? 104 : spot.name.length > 28 ? 64 : 80, lineHeight: 1.05, letterSpacing: -1 }}>{spot.name}</div>
            <div style={{ display: "flex", marginTop: 24, fontSize: tall ? 38 : 30, color: C.pencil }}>
              {category} / {hood}
            </div>
            <div style={{ display: "flex", flexDirection: "column", marginTop: tall ? 56 : 36, gap: tall ? 20 : 12 }}>
              {attrs.map((a) => (
                <div key={a} style={{ display: "flex", fontSize: tall ? 40 : 30, fontWeight: 700 }}>
                  {a}
                </div>
              ))}
            </div>
            {blurb && <div style={{ display: "flex", marginTop: 56, fontSize: 36, lineHeight: 1.6, color: C.ink, maxWidth: 880 }}>{blurb}</div>}
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: tall ? 260 : 220, height: tall ? 260 : 220, border: `4px solid ${C.pen}`, borderRadius: 999, color: C.pen, fontFamily: "Serif", fontSize: tall ? 110 : 92 }}>
              {score.toFixed(1)}
            </div>
            <div style={{ display: "flex", fontSize: tall ? 30 : 24, color: C.pencil }}>
              {m.score.label} /10
            </div>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", borderTop: `2px solid ${C.rule}`, paddingTop: 24, fontSize: tall ? 32 : 24, color: C.pencil }}>
          <span>{host}</span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Serif", data: serif, weight: 500, style: "normal" },
        { name: "Sans", data: sans, weight: 400, style: "normal" },
        { name: "Sans", data: sansBold, weight: 700, style: "normal" },
      ],
    },
  );
}
