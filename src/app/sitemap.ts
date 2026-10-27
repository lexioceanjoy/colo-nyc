import type { MetadataRoute } from "next";
import { getVisibleSpots } from "@/lib/spots";
import { site } from "@/config/site";

const alt = (path: string) => ({ languages: { en: `${site.url}/en${path}`, "zh-Hans": `${site.url}/zh${path}` } });

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ["", "/about", ...getVisibleSpots().map((s) => `/spot/${s.slug}`)];
  return paths.flatMap((p) =>
    (["en", "zh"] as const).map((l) => ({ url: `${site.url}/${l}${p}`, alternates: alt(p), changeFrequency: "weekly" as const })),
  );
}
