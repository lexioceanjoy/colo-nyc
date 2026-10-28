"use client";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Suspense, useState } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { nyDate, nyLocalToISO } from "@/lib/hours";
import { invalidateCounts } from "@/lib/social";
import type { SpotIndex } from "@/lib/spot-index";

const field = "mt-1 w-full rounded-lg border border-rule bg-paper px-3 py-2";

function Form({ spots, initialSpot }: { spots: SpotIndex; initialSpot: string }) {
  const t = useTranslations("sessions");
  const tf = useTranslations("sessions.form");
  const locale = useLocale();
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const options = Object.entries(spots).sort((a, b) => a[1].name.localeCompare(b[1].name));

  if (loading) return null;
  if (!user || !profile)
    return (
      <Link href={`/signin?next=${encodeURIComponent(`/${locale}/sessions/new${initialSpot ? `?spot=${initialSpot}` : ""}`)}`} className="rounded-full bg-pen px-4 py-2 text-paper">
        {t("signInToRsvp")}
      </Link>
    );

  return (
    <>
      <h1 className="font-serif text-3xl">{t("host")}</h1>
      <form
        data-testid="host-form"
        className="mt-6 space-y-4"
        action={async (form) => {
          const sb = supabaseBrowser();
          if (!sb) return;
          const date = String(form.get("date"));
          const starts_at = nyLocalToISO(date, String(form.get("start")));
          let ends_at = nyLocalToISO(date, String(form.get("end")));
          if (ends_at <= starts_at) ends_at = new Date(new Date(ends_at).getTime() + 86400000).toISOString();
          setBusy(true);
          const { data, error } = await sb
            .from("sessions")
            .insert({
              host_id: user.id,
              spot_slug: String(form.get("spot")),
              starts_at,
              ends_at,
              capacity: Number(form.get("capacity")),
              title: String(form.get("title")).trim(),
              description: String(form.get("description") ?? "").trim() || null,
              community_tag: form.get("next_play") ? "next_play" : null,
            })
            .select("id")
            .single();
          setBusy(false);
          if (error) return setMsg(/3 upcoming/.test(error.message) ? tf("limit") : error.message);
          invalidateCounts();
          router.push(`/sessions/${data.id}?created=1`);
        }}
      >
        <label className="block">
          {tf("spot")}
          <select name="spot" required defaultValue={initialSpot} className={field}>
            <option value="" disabled>
              {tf("spotPh")}
            </option>
            {options.map(([slug, s]) => (
              <option key={slug} value={slug}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-3 gap-3">
          <label className="col-span-3 block sm:col-span-1">
            {tf("date")}
            <input type="date" name="date" required min={nyDate()} defaultValue={nyDate()} className={field} />
          </label>
          <label className="block">
            {tf("start")}
            <input type="time" name="start" required defaultValue="10:00" className={field} />
          </label>
          <label className="block">
            {tf("end")}
            <input type="time" name="end" required defaultValue="13:00" className={field} />
          </label>
        </div>
        <label className="block">
          {tf("capacity")}
          <input type="number" name="capacity" min={2} max={12} defaultValue={6} required className={field} />
        </label>
        <label className="block">
          {tf("title")}
          <input name="title" required maxLength={60} placeholder={tf("titlePh")} className={field} />
        </label>
        <label className="block">
          {tf("description")}
          <textarea name="description" maxLength={300} rows={3} className={field} />
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="next_play" defaultChecked={profile.community_tags.includes("next_play")} className="accent-[var(--pen)]" />
          {tf("nextPlayOnly")}
        </label>
        <button disabled={busy} className="rounded-full bg-pen px-5 py-2.5 text-paper disabled:opacity-50" data-testid="host-submit">
          {tf("create")}
        </button>
        {msg && <p role="alert">{msg}</p>}
      </form>
    </>
  );
}

function WithParams({ spots }: { spots: SpotIndex }) {
  const spot = useSearchParams().get("spot") ?? "";
  return <Form spots={spots} initialSpot={spot in spots ? spot : ""} />;
}

export function HostForm({ spots }: { spots: SpotIndex }) {
  return (
    <Suspense fallback={null}>
      <WithParams spots={spots} />
    </Suspense>
  );
}
