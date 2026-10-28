"use client";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import type { User } from "@supabase/supabase-js";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { formatSessionTime } from "@/lib/hours";
import type { PublicSession } from "@/lib/social";
import { NEIGHBORHOODS, type NeighborhoodKey } from "@/data/neighborhoods";

export function RsvpButton({ s, user, onChange }: { s: PublicSession; user: User | null; onChange?: () => void }) {
  const t = useTranslations("sessions");
  const locale = useLocale();
  const [going, setGoing] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const sb = supabaseBrowser();
    if (!sb || !user) return;
    sb.from("rsvps").select("session_id").eq("session_id", s.id).eq("user_id", user.id).maybeSingle().then(({ data }) => setGoing(Boolean(data)));
  }, [s.id, user]);

  if (!user)
    return (
      <Link href={`/signin?next=${encodeURIComponent(`/${locale}/sessions/${s.id}`)}`} className="rounded-full border border-rule px-3 py-1.5 text-sm">
        {t("signInToRsvp")}
      </Link>
    );
  if (going === null) return null;
  const full = !going && s.rsvp_count >= s.capacity;
  return (
    <button
      type="button"
      disabled={busy || full}
      data-testid="rsvp"
      onClick={async () => {
        const sb = supabaseBrowser();
        if (!sb) return;
        setBusy(true);
        const { error } = going
          ? await sb.from("rsvps").delete().eq("session_id", s.id).eq("user_id", user.id)
          : await sb.from("rsvps").insert({ session_id: s.id, user_id: user.id });
        setBusy(false);
        if (!error) {
          setGoing(!going);
          onChange?.();
        }
      }}
      className={`rounded-full px-3 py-1.5 text-sm disabled:opacity-50 ${going ? "border border-rule" : "bg-pen text-paper"}`}
    >
      {full ? t("full") : going ? t("unrsvp") : t("rsvp")}
    </button>
  );
}

export function SessionCard({
  s,
  spotName,
  neighborhood,
  user,
  onChange,
}: {
  s: PublicSession;
  spotName: string;
  neighborhood?: string;
  user: User | null;
  onChange?: () => void;
}) {
  const t = useTranslations("sessions");
  const locale = useLocale() as "en" | "zh";
  const hood = neighborhood && neighborhood in NEIGHBORHOODS ? NEIGHBORHOODS[neighborhood as NeighborhoodKey][locale] : null;
  return (
    <li className="rounded-xl border border-rule p-4" data-testid="session-card">
      <p className="text-sm text-pencil">{formatSessionTime(s.starts_at, s.ends_at, locale)}</p>
      <h3 className="mt-1 font-serif text-xl">
        <Link href={`/sessions/${s.id}`} className="hover:underline">
          {s.title}
        </Link>
        {s.community_tag === "next_play" && <span className="ml-2 rounded-full bg-pen-soft px-2 align-middle font-sans text-xs">Next Play</span>}
      </h3>
      <p className="text-sm">
        {spotName}
        {hood && <span className="text-pencil"> · {hood}</span>}
      </p>
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="text-sm tabular-nums">{t("going", { going: s.rsvp_count, capacity: s.capacity })}</span>
        <RsvpButton s={s} user={user} onChange={onChange} />
      </div>
    </li>
  );
}
