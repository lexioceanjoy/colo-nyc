"use client";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth";
import { nyDate } from "@/lib/hours";
import {
  useTodayCounts,
  fetchCheckins,
  fetchMyCheckin,
  upsertCheckin,
  deleteCheckin,
  report,
  type Checkin,
  type CheckinWindow,
  type OpenTo,
} from "@/lib/social";
import { SpotSessions } from "./SpotSessions";
import { HowsItHere } from "./Crowd";
import type { Core5 } from "@/lib/core";

const WINDOWS: CheckinWindow[] = ["morning", "afternoon", "evening", "all_day"];
const OPEN_TO: OpenTo[] = ["chat", "lunch", "quiet_cowork", "feedback"];

export function hostOf(url: string | null) {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

// Social block (SPEC §6.3, §7). Anonymous visitors only ever see counts.
export function SpotSocial({ slug, missing = [] }: { slug: string; missing?: Core5[] }) {
  const t = useTranslations("social");
  const tc = useTranslations("checkin");
  const locale = useLocale();
  const { counts, ready } = useTodayCounts();
  const { user, profile, loading } = useAuth();
  const [list, setList] = useState<Checkin[] | null>(null);
  const [mine, setMine] = useState<Checkin | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [askHow, setAskHow] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) return;
    const today = nyDate();
    const [l, m] = await Promise.all([fetchCheckins(slug, today), fetchMyCheckin(user.id, today)]);
    setList(l);
    setMine(m);
  }, [user, slug]);

  useEffect(() => {
    // Async fetch; state is set when it resolves.
    const id = setTimeout(refresh, 0);
    return () => clearTimeout(id);
  }, [refresh]);

  const n = list ? list.length : (counts[slug] ?? 0);
  const hereIsMine = mine?.spot_slug === slug;
  const next = `/${locale}/spot/${slug}`;

  return (
    <section id="checkin" className="mt-8 scroll-mt-20 rounded-xl border border-rule p-4" aria-live="polite" data-testid="spot-social">
      <p className="flex items-center gap-2 font-serif text-xl">
        <span className={`inline-block size-2.5 rounded-full bg-highlight ${n > 0 ? "pulse" : "opacity-50"}`} aria-hidden />
        <span data-testid="here-count">{t("hereToday", { count: n })}</span>
      </p>
      <p className="mt-1 text-sm text-pencil">{tc("expires")}</p>
      {!ready && !user && <p className="mt-1 text-sm text-pencil">{t("comingSoon")}</p>}

      {user && list && list.length > 0 && (
        <ul className="mt-3 space-y-2" data-testid="checkin-list">
          {list.map((c) => (
            <li key={c.id} className="flex items-start justify-between gap-3 rounded-lg bg-paper-2 px-3 py-2">
              <div className="min-w-0">
                <p className="font-medium" data-testid="checkin-name">
                  {c.profiles?.display_name ?? "?"}
                  {c.user_id === user.id && <span className="text-pencil"> ({tc("you")})</span>}
                  {c.profiles?.community_tags?.includes("next_play") && <span className="ml-2 rounded-full bg-pen-soft px-2 text-xs">Next Play</span>}
                </p>
                {c.profiles?.headline && <p className="text-sm text-pencil">{c.profiles.headline}</p>}
                <p className="text-sm">
                  {tc(`windows.${c.window}`)}
                  {c.open_to.length > 0 && ` · ${c.open_to.map((o) => tc(`openToOpts.${o}`)).join(", ")}`}
                </p>
                {c.note && <p className="text-sm">“{c.note}”</p>}
                {hostOf(c.profiles?.link_url ?? null) && (
                  <a href={c.profiles!.link_url!} target="_blank" rel="noopener noreferrer nofollow ugc" className="text-sm text-pen underline">
                    {hostOf(c.profiles!.link_url)}
                  </a>
                )}
              </div>
              {c.user_id !== user.id && (
                <button
                  type="button"
                  className="shrink-0 text-xs text-pencil underline"
                  onClick={async () => {
                    await report("checkin", c.id);
                    setMsg(tc("reported"));
                  }}
                >
                  {tc("report")}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {!loading && !user && (
          <Link href={`/signin?next=${encodeURIComponent(next)}`} className="rounded-full bg-pen px-4 py-2 text-paper" data-testid="signin-to-checkin">
            {tc("signInToCheckIn")}
          </Link>
        )}
        {user && !profile && (
          <Link href={`/profile?onboarding=1&next=${encodeURIComponent(next)}`} className="rounded-full bg-pen px-4 py-2 text-paper">
            {tc("imHere")}
          </Link>
        )}
        {user && profile && !formOpen && (
          <button type="button" onClick={() => setFormOpen(true)} className="rounded-full bg-pen px-4 py-2 text-paper" data-testid="checkin-open">
            {hereIsMine ? tc("edit") : mine ? tc("move") : tc("imHere")}
          </button>
        )}
        {user && hereIsMine && !formOpen && (
          <button
            type="button"
            onClick={async () => {
              await deleteCheckin(mine!.id);
              await refresh();
            }}
            className="rounded-full border border-rule px-4 py-2"
            data-testid="checkout"
          >
            {tc("checkout")}
          </button>
        )}
      </div>

      {user && profile && formOpen && (
        <form
          data-testid="checkin-form"
          className="mt-4 space-y-3"
          action={async (form) => {
            const r = await upsertCheckin(
              user.id,
              {
                spot_slug: slug,
                window: (form.get("window") as CheckinWindow) ?? "all_day",
                open_to: OPEN_TO.filter((o) => form.get(`open_${o}`)),
                note: String(form.get("note") ?? "").trim().slice(0, 120) || null,
              },
              mine?.id,
            );
            setMsg(r.error ?? tc("saved"));
            setFormOpen(false);
            if (!r.error) setAskHow(true);
            await refresh();
          }}
        >
          <fieldset>
            <legend className="text-sm text-pencil">{tc("window")}</legend>
            <div className="mt-1 flex flex-wrap gap-2">
              {WINDOWS.map((w) => (
                <label key={w} className="flex items-center gap-1 rounded-full border border-rule px-3 py-1.5 has-[:checked]:border-pen has-[:checked]:bg-pen-soft">
                  <input type="radio" name="window" value={w} defaultChecked={(hereIsMine ? mine!.window : "all_day") === w} className="sr-only" />
                  {tc(`windows.${w}`)}
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="text-sm text-pencil">{tc("openTo")}</legend>
            <div className="mt-1 flex flex-wrap gap-2">
              {OPEN_TO.map((o) => (
                <label key={o} className="flex items-center gap-1 rounded-full border border-rule px-3 py-1.5 has-[:checked]:border-pen has-[:checked]:bg-pen-soft">
                  <input type="checkbox" name={`open_${o}`} defaultChecked={hereIsMine && mine!.open_to.includes(o)} className="sr-only" />
                  {tc(`openToOpts.${o}`)}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="block text-sm">
            {tc("note")}
            <input name="note" maxLength={120} defaultValue={hereIsMine ? (mine!.note ?? "") : ""} placeholder={tc("notePh")} className="mt-1 w-full rounded-lg border border-rule bg-paper px-3 py-2" />
          </label>
          <button className="rounded-full bg-pen px-4 py-2 text-paper" data-testid="checkin-save">
            {tc("save")}
          </button>
        </form>
      )}
      {msg && (
        <p role="status" className="mt-3 text-sm">
          {msg}
        </p>
      )}
      {askHow && <HowsItHere missing={missing} onClose={() => setAskHow(false)} />}
      <SpotSessions slug={slug} />
    </section>
  );
}
