"use client";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth";
import { fetchPublicSessions, type PublicSession } from "@/lib/social";
import type { SpotIndex } from "@/lib/spot-index";
import { SessionCard } from "./SessionCard";

export function SessionsList({ spots }: { spots: SpotIndex }) {
  const t = useTranslations("sessions");
  const tb = useTranslations("borough");
  const tf = useTranslations("filters");
  const { user } = useAuth();
  const [list, setList] = useState<PublicSession[] | null>(null);
  const [tag, setTag] = useState<"all" | "next_play">("all");
  const [boro, setBoro] = useState<string>("");
  const load = useCallback(() => fetchPublicSessions().then(setList), []);
  useEffect(() => {
    const id = setTimeout(load, 0);
    return () => clearTimeout(id);
  }, [load]);
  const shown = (list ?? []).filter((s) => (tag === "all" || s.community_tag === tag) && (!boro || spots[s.spot_slug]?.borough === boro));
  return (
    <>
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <Link href="/sessions/new" className="rounded-full bg-pen px-4 py-2 text-paper" data-testid="host-session">
          {t("host")}
        </Link>
        {(["all", "next_play"] as const).map((v) => (
          <button key={v} type="button" aria-pressed={tag === v} onClick={() => setTag(v)} className={`rounded-full border px-3 py-1.5 text-sm ${tag === v ? "border-pen bg-pen-soft" : "border-rule"}`}>
            {v === "all" ? t("filterAll") : t("filterNextPlay")}
          </button>
        ))}
        <select value={boro} onChange={(e) => setBoro(e.target.value)} className="rounded-full border border-rule bg-paper px-3 py-1.5 text-sm" aria-label={tf("borough")}>
          <option value="">{tf("allBoroughs")}</option>
          {["manhattan", "brooklyn", "queens"].map((b) => (
            <option key={b} value={b}>
              {tb(b)}
            </option>
          ))}
        </select>
      </div>
      <h2 className="mt-8 font-serif text-2xl">{t("upcoming")}</h2>
      {list && shown.length === 0 && <p className="mt-2 text-pencil">{t("none")}</p>}
      <ul className="mt-3 space-y-3" data-testid="sessions-list">
        {shown.map((s) => (
          <SessionCard key={s.id} s={s} spotName={spots[s.spot_slug]?.name ?? s.spot_slug} neighborhood={spots[s.spot_slug]?.neighborhood} user={user} onChange={load} />
        ))}
      </ul>
    </>
  );
}
