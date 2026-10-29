"use client";
import { useLocale, useTranslations } from "next-intl";
import { createContext, useContext, useEffect, useState } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { flags } from "@/config/flags";
import { revalidateSpot } from "@/app/actions";
import type { CrowdApplied } from "@/lib/crowd-rules";
import { useAuth } from "@/lib/auth";
import { useConfirmed, myVotes, vote, CROWD_OPTIONS, formatHoursVote, type Confirmed } from "@/lib/crowd";
import { formatTime } from "@/lib/hours";
import type { Core5 } from "@/lib/core";

type Ctx = { slug: string; available: boolean; confirmed: Confirmed; mine: Partial<Record<Core5, string>>; refresh: () => void };
const CrowdCtx = createContext<Ctx | null>(null);

/** Shares confirmed crowd values and my own votes across a spot page. */
export function CrowdProvider({ slug, children }: { slug: string; children: React.ReactNode }) {
  const { user } = useAuth();
  const { confirmed, available, reload } = useConfirmed(slug);
  const [mine, setMine] = useState<Partial<Record<Core5, string>>>({});
  useEffect(() => {
    if (user) myVotes(user.id, slug).then(setMine);
  }, [user, slug]);
  const refresh = () => {
    reload();
    if (user) myVotes(user.id, slug).then(setMine);
  };
  return <CrowdCtx.Provider value={{ slug, available, confirmed, mine, refresh }}>{children}</CrowdCtx.Provider>;
}

/** Null when there's no provider or the crowd backend isn't available (migration not applied). */
export function useCrowd() {
  const c = useContext(CrowdCtx);
  return c?.available ? c : null;
}

const HOURS = Array.from({ length: 25 }, (_, h) => String(h).padStart(2, "0"));

function useValueLabel() {
  const t = useTranslations();
  const tc = useTranslations("crowd");
  const locale = useLocale();
  return (field: Core5, value: string) =>
    field === "hours"
      ? formatHoursVote(value, { weekday: tc("weekday"), weekend: tc("weekend"), closed: tc("closed") }, (hh) => formatTime(hh, locale))
      : t(`attr.values.${field}.${value}`);
}

export function HoursPicker({ name, defaultValue }: { name: string; defaultValue?: string }) {
  const tc = useTranslations("crowd");
  const locale = useLocale();
  const [closed, setClosed] = useState(defaultValue === "closed");
  const [o, c] = defaultValue && defaultValue !== "closed" ? defaultValue.split("-") : ["08", "18"];
  const sel = "rounded-lg border border-rule bg-paper px-2 py-1";
  return (
    <span className="flex flex-wrap items-center gap-2">
      <label className="flex items-center gap-1">
        <input type="checkbox" name={`${name}_closed`} defaultChecked={closed} onChange={(e) => setClosed(e.target.checked)} className="accent-[var(--pen)]" />
        {tc("closed")}
      </label>
      {!closed && (
        <>
          <select name={`${name}_open`} defaultValue={o} aria-label={tc("opens")} className={sel}>
            {HOURS.slice(0, 24).map((h) => (
              <option key={h} value={h}>
                {formatTime(`${h}:00`, locale)}
              </option>
            ))}
          </select>
          –
          <select name={`${name}_close`} defaultValue={c} aria-label={tc("closes")} className={sel}>
            {HOURS.slice(1).map((h) => (
              <option key={h} value={h}>
                {formatTime(`${h}:00`, locale)}
              </option>
            ))}
          </select>
        </>
      )}
    </span>
  );
}

function readHours(form: FormData): string {
  const part = (p: string) => (form.get(`${p}_closed`) ? "closed" : `${form.get(`${p}_open`)}-${form.get(`${p}_close`)}`);
  return `${part("wd")}|${part("we")}`;
}

/** One question about one core detail. Signed-in only; votes are private and changeable. */
export function CrowdQuestion({ field, onDone, compact }: { field: Core5; onDone?: () => void; compact?: boolean }) {
  const t = useTranslations();
  const tc = useTranslations("crowd");
  const locale = useLocale();
  const crowd = useCrowd();
  const { user } = useAuth();
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  if (!crowd) return null;
  if (!user)
    return (
      <Link href={`/signin?next=${encodeURIComponent(`/${locale}/spot/${crowd.slug}`)}`} className="text-sm text-pen underline">
        {tc("signIn")}
      </Link>
    );
  const mine = crowd.mine[field];
  const save = async (value: string) => {
    const r = await vote(user.id, crowd.slug, field, value);
    if (!r.error && flags.crowdSingleReport) {
      // One report counts right away: re-render the static page with it.
      await revalidateSpot(crowd.slug);
      router.refresh();
    }
    setMsg(r.error ?? (flags.crowdSingleReport ? tc("savedNow") : tc("saved")));
    crowd.refresh();
    onDone?.();
  };
  if (field === "hours") {
    const [wd, we] = mine?.split("|") ?? [];
    return (
      <form action={(f) => save(readHours(f))} className="space-y-2 text-sm" data-testid="crowd-hours">
        {!compact && <p className="text-pencil">{t("attr.hours")}</p>}
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-20">{tc("weekday")}</span>
          <HoursPicker name="wd" defaultValue={wd} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-20">{tc("weekend")}</span>
          <HoursPicker name="we" defaultValue={we} />
        </div>
        <button className="rounded-full bg-pen px-3 py-1 text-paper">{tc("save")}</button>
        {msg && <p role="status">{msg}</p>}
      </form>
    );
  }
  return (
    <div className="text-sm" data-testid={`crowd-${field}`}>
      {!compact && <p className="text-pencil">{t(`attr.${field}`)}</p>}
      <div className="mt-1 flex flex-wrap gap-1.5">
        {CROWD_OPTIONS[field].map((v) => (
          <button
            key={v}
            type="button"
            aria-pressed={mine === v}
            onClick={() => save(v)}
            className={`rounded-full border px-3 py-1 ${mine === v ? "border-pen bg-pen-soft" : "border-rule hover:border-pen"}`}
          >
            {t(`attr.values.${field}.${v}`)}
          </button>
        ))}
      </div>
      {msg && <p role="status" className="mt-1">{msg}</p>}
    </div>
  );
}

/** "Know this?" on an unknown detail: shows a confirmed crowd value if there is one, else asks. */
/**
 * "Know this?" (unknowns, guesses, visitor reports) or a quieter "Not right?" (well-sourced details):
 * both open the same question, so 2+ disagreeing reports can correct even researched data (Phase 1).
 */
export function KnowThis({ field, quiet }: { field: Core5; quiet?: boolean }) {
  const tc = useTranslations("crowd");
  const crowd = useCrowd();
  const label = useValueLabel();
  const [open, setOpen] = useState(false);
  if (!crowd) return null;
  // With single-report crowd details, values are merged on the server; the old 2-person display isn't needed.
  const c = flags.crowdSingleReport ? undefined : crowd.confirmed[field];
  if (c)
    return (
      <p className="mt-1 text-sm" data-testid={`crowd-confirmed-${field}`}>
        <span className="font-medium">{label(field, c.value)}</span> <span className="text-pencil">· {tc("confirmed", { n: c.votes })}</span>
      </p>
    );
  return open ? (
    <div className="mt-2 rounded-lg bg-paper-2 p-3">
      <CrowdQuestion field={field} compact />
    </div>
  ) : (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className={`mt-1 text-sm underline ${quiet ? "text-pencil" : "text-pen"}`}
      data-testid={`know-${field}`}
    >
      {quiet ? tc("notRight") : tc("knowThis")}
    </button>
  );
}

/** Shown right after a check-in: only this spot's missing core details, minus anything already confirmed. */
export function HowsItHere({ missing, onClose }: { missing: Core5[]; onClose: () => void }) {
  const tc = useTranslations("crowd");
  const crowd = useCrowd();
  if (!crowd) return null;
  const ask = flags.crowdSingleReport ? missing : missing.filter((f) => !crowd.confirmed[f]);
  if (!ask.length) return null;
  const done = ask.every((f) => crowd.mine[f]);
  return (
    <section className="mt-4 rounded-xl border border-pen/40 bg-pen-soft/40 p-4" data-testid="hows-it-here">
      <h3 className="font-serif text-xl">{tc("howTitle")}</h3>
      <p className="text-sm text-pencil">{done ? tc("thanksAll") : tc("howLede")}</p>
      <div className="mt-3 space-y-4">
        {ask.map((f) => (
          <CrowdQuestion key={f} field={f} />
        ))}
      </div>
      <button type="button" onClick={onClose} className="mt-3 text-sm text-pencil underline">
        {tc("skip")}
      </button>
    </section>
  );
}

/** "Reported by 2 visitors · Oct 29" or "Visitors disagree · Oct 29" under a crowd-filled detail. */
export function CrowdLabel({ info, field }: { info: CrowdApplied; field: Core5 }) {
  const tc = useTranslations("crowd");
  const locale = useLocale();
  const date = new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-US", { month: "short", day: "numeric", timeZone: "America/New_York" }).format(new Date(info.lastAt));
  return (
    <p className="mt-1 text-xs text-pencil" data-testid={`crowd-label-${field}`}>
      {info.disagree ? tc("disagree", { date }) : tc("reportedBy", { n: info.reports, date })}
    </p>
  );
}
