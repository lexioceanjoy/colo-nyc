"use client";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { CATEGORIES } from "@/lib/schema";
import { submitSpot } from "@/app/actions";

const field = "mt-1 w-full rounded-lg border border-rule bg-paper px-3 py-2";

export function SubmitForm() {
  const t = useTranslations("submit");
  const tc = useTranslations("category");
  const [state, setState] = useState<"idle" | "busy" | "done" | "limit" | "error">("idle");
  if (state === "done") return <p role="status" className="mt-6 rounded-lg bg-paper-2 px-4 py-3">{t("thanks")}</p>;
  return (
    <form
      className="mt-6 space-y-4"
      data-testid="submit-form"
      action={async (form) => {
        setState("busy");
        const r = await submitSpot(form);
        setState(r.ok ? "done" : r.error === "limit" ? "limit" : "error");
      }}
    >
      <label className="block">
        {t("name")}
        <input name="name" required maxLength={120} className={field} />
      </label>
      <label className="block">
        {t("addr")}
        <input name="address_or_link" required maxLength={300} className={field} />
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
      <label className="block">
        {t("why")}
        <textarea name="why" maxLength={300} rows={3} className={field} />
      </label>
      {/* Honeypot: hidden from people, irresistible to bots. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 overflow-hidden">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <button disabled={state === "busy"} className="rounded-full bg-pen px-5 py-2.5 text-paper disabled:opacity-50">
        {t("send")}
      </button>
      {state === "limit" && <p role="alert">{t("limit")}</p>}
      {state === "error" && <p role="alert">{t("error")}</p>}
    </form>
  );
}
