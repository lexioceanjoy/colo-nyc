"use client";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { CATEGORIES } from "@/lib/schema";
import { CROWD_VALUES } from "@/lib/crowd-values";
import { NEIGHBORHOODS, type NeighborhoodKey } from "@/data/neighborhoods";
import { flags } from "@/config/flags";
import { useAuth } from "@/lib/auth";
import { submitSpot } from "@/app/actions";
import { HoursPicker } from "./Crowd";

const field = "mt-1 w-full rounded-lg border border-rule bg-paper px-3 py-2";
type State = "idle" | "busy" | "done" | "limit" | "error" | "duplicate" | "pending";

function QuickTaps({ name, values, label }: { name: string; values: readonly string[]; label: string }) {
  const t = useTranslations("attr.values");
  return (
    <fieldset>
      <legend className="text-sm text-pencil">{label}</legend>
      <div className="mt-1 flex flex-wrap gap-1.5">
        {values.map((v) => (
          <label key={v} className="cursor-pointer rounded-full border border-rule px-3 py-1 text-sm has-[:checked]:border-pen has-[:checked]:bg-pen-soft has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-pen">
            <input type="radio" name={name} value={v} className="sr-only" />
            {t(`${name.replace("a_", "")}.${v}`)}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function SubmitForm() {
  const t = useTranslations("submit");
  const ta = useTranslations("attr");
  const tc = useTranslations("category");
  const tcr = useTranslations("crowd");
  const locale = useLocale() as "en" | "zh";
  const { user, profile } = useAuth();
  const [state, setState] = useState<State>("idle");
  const [dupSlug, setDupSlug] = useState<string | null>(null);
  const [knowHours, setKnowHours] = useState(false);
  const hoods = (Object.keys(NEIGHBORHOODS) as NeighborhoodKey[]).sort((a, b) => NEIGHBORHOODS[a][locale].localeCompare(NEIGHBORHOODS[b][locale]));

  if (state === "done") return <p role="status" className="mt-6 rounded-lg bg-paper-2 px-4 py-3" data-testid="submit-done">{t("thanks")}</p>;
  return (
    <form
      className="mt-6 space-y-4"
      data-testid="submit-form"
      action={async (form) => {
        if (knowHours) {
          const part = (p: string) => (form.get(`${p}_closed`) ? "closed" : `${form.get(`${p}_open`)}-${form.get(`${p}_close`)}`);
          form.set("a_hours", `${part("wd")}|${part("we")}`);
        }
        setState("busy");
        const r = await submitSpot(form);
        if (r.ok) return setState("done");
        if (r.error === "duplicate") {
          setDupSlug(r.slug ?? null);
          return setState(r.slug ? "duplicate" : "pending");
        }
        setState(r.error === "limit" ? "limit" : "error");
      }}
    >
      <label className="block">
        {t("name")}
        <input name="name" required maxLength={120} className={field} />
      </label>
      {flags.suggestFlow && (
        <label className="block">
          {t("neighborhood")}
          <select name="neighborhood" defaultValue="" className={field}>
            <option value="">{t("neighborhoodAny")}</option>
            {hoods.map((k) => (
              <option key={k} value={k}>
                {NEIGHBORHOODS[k][locale]}
              </option>
            ))}
          </select>
        </label>
      )}
      <label className="block">
        {t("addr")}
        <input name="address_or_link" required maxLength={300} className={field} />
        {flags.suggestFlow && <span className="text-sm text-pencil">{t("addrHint")}</span>}
      </label>
      <label className="block">
        {t("category")}
        <select name="category" defaultValue="cafe" className={field}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {tc(c)}
            </option>
          ))}
        </select>
      </label>

      {flags.suggestFlow && (
        <section className="space-y-3 rounded-xl border border-rule p-4" data-testid="quick-taps">
          <p className="font-medium">{t("quickTitle")}</p>
          <p className="text-sm text-pencil">{user ? t("quickNote") : t("quickNoteAnon")}</p>
          {(Object.keys(CROWD_VALUES) as (keyof typeof CROWD_VALUES)[]).map((k) => (
            <QuickTaps key={k} name={`a_${k}`} values={CROWD_VALUES[k]} label={ta(k)} />
          ))}
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={knowHours} onChange={(e) => setKnowHours(e.target.checked)} className="accent-[var(--pen)]" />
            {t("knowHours")}
          </label>
          {knowHours && (
            <div className="space-y-2 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="w-20">{tcr("weekday")}</span>
                <HoursPicker name="wd" />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="w-20">{tcr("weekend")}</span>
                <HoursPicker name="we" />
              </div>
            </div>
          )}
        </section>
      )}

      <label className="block">
        {t("why")}
        <textarea name="why" maxLength={300} rows={3} className={field} />
      </label>
      {flags.suggestFlow && user && profile && (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="credit" className="accent-[var(--pen)]" />
          {t("credit", { name: profile.display_name })}
        </label>
      )}
      {/* Honeypot: hidden from people, irresistible to bots. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 overflow-hidden">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <button disabled={state === "busy"} className="rounded-full bg-pen px-5 py-2.5 text-paper disabled:opacity-50" data-testid="submit-send">
        {t("send")}
      </button>
      {state === "limit" && <p role="alert">{t("limit")}</p>}
      {state === "error" && <p role="alert">{t("error")}</p>}
      {state === "pending" && <p role="alert">{t("duplicatePending")}</p>}
      {state === "duplicate" && dupSlug && (
        <p role="alert" data-testid="submit-duplicate">
          {t("duplicate")}{" "}
          <Link href={`/spot/${dupSlug}`} className="text-pen underline">
            {t("duplicateLink")}
          </Link>
        </p>
      )}
    </form>
  );
}
