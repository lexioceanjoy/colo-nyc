"use client";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { submitCorrection } from "@/app/actions";

const FIELDS = ["hours", "wifi", "outlets", "seating", "noise", "laptopPolicy", "timeLimitMin", "callsOk", "groupCapacity", "restroom", "closed", "other"] as const;

export function CorrectionForm({ slug }: { slug: string }) {
  const t = useTranslations("correction");
  const ts = useTranslations("submit");
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<"idle" | "busy" | "done" | "limit" | "error">("idle");
  if (state === "done") return <p role="status" className="text-sm">{t("thanks")}</p>;
  if (!open)
    return (
      <button type="button" onClick={() => setOpen(true)} className="rounded-full border border-rule px-4 py-2 hover:border-pen">
        {t("title")}
      </button>
    );
  return (
    <form
      className="w-full space-y-3 rounded-xl border border-rule p-4"
      action={async (form) => {
        setState("busy");
        const r = await submitCorrection(form);
        setState(r.ok ? "done" : r.error === "limit" ? "limit" : "error");
      }}
    >
      <input type="hidden" name="spot_slug" value={slug} />
      <label className="block text-sm">
        {t("field")}
        <select name="field" className="mt-1 w-full rounded-lg border border-rule bg-paper px-3 py-2">
          {FIELDS.map((f) => (
            <option key={f} value={f}>
              {t(`fields.${f}`)}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        {t("suggested")}
        <input name="suggested" required maxLength={200} className="mt-1 w-full rounded-lg border border-rule bg-paper px-3 py-2" />
      </label>
      <div aria-hidden className="absolute -left-[9999px] h-0 overflow-hidden">
        <input name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <button disabled={state === "busy"} className="rounded-full bg-pen px-4 py-2 text-paper disabled:opacity-50">
        {t("send")}
      </button>
      {state === "limit" && <p role="alert" className="text-sm">{ts("limit")}</p>}
      {state === "error" && <p role="alert" className="text-sm">{ts("error")}</p>}
    </form>
  );
}
