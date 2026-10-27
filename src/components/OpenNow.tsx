"use client";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { isOpenNow } from "@/lib/hours";
import type { HoursRange } from "@/lib/schema";

// Computed client-side: the page is static, "now" isn't.
export function OpenNow({ hours }: { hours: HoursRange[] | "unknown" }) {
  const t = useTranslations("spot");
  const [open, setOpen] = useState<boolean | null>(null);
  useEffect(() => {
    const tick = () => setOpen(isOpenNow(hours));
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [hours]);
  if (open === null) return null;
  return <span className={`font-sans text-base ${open ? "text-ok" : "text-pencil"}`}>{open ? t("openNow") : t("closedNow")}</span>;
}
