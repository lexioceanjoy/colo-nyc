"use client";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { site } from "@/config/site";

type Override = { status: "ai_researched" | "verified"; verified_by: string | null };

/** AI-researched vs Verified. Admin overrides (spot_overrides) apply at runtime, no deploy needed (SPEC §6.7). */
export function StatusBadge({ slug, status, verifiedBy }: { slug: string; status: "ai_researched" | "verified"; verifiedBy?: string }) {
  const t = useTranslations("status");
  const [o, setO] = useState<Override | null>(null);
  useEffect(() => {
    supabaseBrowser()
      ?.from("spot_overrides")
      .select("status,verified_by")
      .eq("slug", slug)
      .maybeSingle()
      .then(({ data }) => setO((data as Override | null) ?? null));
  }, [slug]);
  const verified = (o?.status ?? status) === "verified";
  const by = o?.verified_by ?? verifiedBy ?? site.ownerName;
  return (
    <span
      data-testid="status-badge"
      className={`rounded-full px-2 py-0.5 ${verified ? "bg-ok/15 text-ok" : "bg-paper-2"}`}
      title={verified ? t("verifiedExplain") : t("aiExplain")}
    >
      {verified ? t("verified", { name: by }) : t("ai_researched")}
    </span>
  );
}
