"use client";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { isOpenNow } from "@/lib/hours";
import type { HoursRange } from "@/lib/schema";

// Computed client-side: the page is static, "now" isn't. Unknown hours say so instead of guessing.
export function OpenNow({ hours }: { hours: HoursRange[] | "unknown" }) {
  const t = useTranslations("spot");
  const [open, setOpen] = useState<boolean | null>(null);
  useEffect(() => {
    if (hours === "unknown") return;
    const tick = () => setOpen(isOpenNow(hours));
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 60_000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [hours]);
  if (hours === "unknown") return <span className="font-sans text-base text-pencil">{t("hoursUnverified")}</span>;
  if (open === null) return null;
  return <span className={`font-sans text-base ${open ? "text-ok" : "text-pencil"}`}>{open ? t("openNow") : t("closedNow")}</span>;
}
