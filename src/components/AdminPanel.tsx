"use client";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { resetDetail, setReviewStatus, setSpotVerified, unhide } from "@/app/actions";

type Row = Record<string, string | null>;
export type AdminData = {
  submissions: Row[];
  corrections: Row[];
  hidden: { table: "checkins" | "sessions" | "profiles"; id: string; label: string }[];
  spots: { slug: string; name: string; verified: boolean }[];
  crowd: { spot_slug: string; field: string; value: string; reports: number; total: number; disagree: boolean }[];
};

export function AdminPanel({ data }: { data: AdminData }) {
  const t = useTranslations("admin");
  const [subs, setSubs] = useState(data.submissions);
  const [corr, setCorr] = useState(data.corrections);
  const [hidden, setHidden] = useState(data.hidden);
  const [spots, setSpots] = useState(data.spots);
  const [crowd, setCrowd] = useState(data.crowd);
  const tc = useTranslations("crowd");
  const [q, setQ] = useState("");
  const [, start] = useTransition();
  const btn = "rounded-full border border-rule px-3 py-1 text-sm hover:border-pen";

  const review = (table: "spot_submissions" | "corrections", id: string, status: "accepted" | "rejected") =>
    start(async () => {
      if ((await setReviewStatus(table, id, status)).ok) (table === "corrections" ? setCorr : setSubs)((l) => l.filter((r) => r.id !== id));
    });

  return (
    <div className="mx-auto w-full max-w-3xl space-y-10 px-4 py-12" data-testid="admin">
      <h1 className="font-serif text-4xl">{t("title")}</h1>

      <section>
        <h2 className="font-serif text-2xl">{t("submissions")} ({subs.length})</h2>
        {subs.length === 0 && <p className="text-pencil">{t("empty")}</p>}
        <ul className="mt-3 space-y-2">
          {subs.map((r) => (
            <li key={r.id} className="rounded-lg bg-paper-2 p-3">
              <p className="font-medium">{r.name} <span className="text-pencil">· {r.category}</span></p>
              <p className="text-sm">{r.address_or_link}</p>
              {r.why && <p className="text-sm text-pencil">{r.why}</p>}
              <p className="mt-2 flex gap-2">
                <button className={btn} onClick={() => review("spot_submissions", r.id!, "accepted")}>{t("accept")}</button>
                <button className={btn} onClick={() => review("spot_submissions", r.id!, "rejected")}>{t("reject")}</button>
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="font-serif text-2xl">{t("corrections")} ({corr.length})</h2>
        {corr.length === 0 && <p className="text-pencil">{t("empty")}</p>}
        <ul className="mt-3 space-y-2">
          {corr.map((r) => (
            <li key={r.id} className="rounded-lg bg-paper-2 p-3">
              <p className="font-medium">{r.spot_slug} <span className="text-pencil">· {r.field}</span></p>
              <p className="text-sm">{r.suggested}</p>
              <p className="mt-2 flex gap-2">
                <button className={btn} onClick={() => review("corrections", r.id!, "accepted")}>{t("accept")}</button>
                <button className={btn} onClick={() => review("corrections", r.id!, "rejected")}>{t("reject")}</button>
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="font-serif text-2xl">{t("hidden")} ({hidden.length})</h2>
        {hidden.length === 0 && <p className="text-pencil">{t("empty")}</p>}
        <ul className="mt-3 space-y-2">
          {hidden.map((h) => (
            <li key={h.id} className="flex items-center justify-between gap-3 rounded-lg bg-paper-2 p-3 text-sm">
              <span>{h.label}</span>
              <button className={btn} onClick={() => start(async () => { if ((await unhide(h.table, h.id)).ok) setHidden((l) => l.filter((x) => x.id !== h.id)); })}>
                {t("unhide")}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section data-testid="admin-crowd">
        <h2 className="font-serif text-2xl">{tc("crowdTitle")} ({crowd.length})</h2>
        {crowd.length === 0 && <p className="text-pencil">{tc("crowdEmpty")}</p>}
        <ul className="mt-3 divide-y divide-rule">
          {crowd.map((r) => (
            <li key={`${r.spot_slug}.${r.field}`} className="flex items-center justify-between gap-3 py-2 text-sm">
              <span>
                <span className="font-medium">{r.spot_slug}</span> · {r.field} = {r.value}{" "}
                <span className="text-pencil">
                  ({r.reports}/{r.total}
                  {r.disagree ? ", tie" : ""})
                </span>
              </span>
              <button
                className={btn}
                data-testid={`reset-${r.spot_slug}-${r.field}`}
                onClick={() =>
                  start(async () => {
                    if ((await resetDetail(r.spot_slug, r.field)).ok) setCrowd((l) => l.filter((x) => !(x.spot_slug === r.spot_slug && x.field === r.field)));
                  })
                }
              >
                {tc("reset")}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="font-serif text-2xl">{t("verify")}</h2>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("search")} className="mt-3 w-full rounded-lg border border-rule bg-paper px-3 py-2" />
        <ul className="mt-3 divide-y divide-rule">
          {spots
            .filter((s) => !q || s.name.toLowerCase().includes(q.toLowerCase()) || s.slug.includes(q.toLowerCase()))
            .map((s) => (
              <li key={s.slug} className="flex items-center justify-between gap-3 py-2">
                <span>
                  {s.name} {s.verified && <span className="text-ok">✓</span>}
                </span>
                <button
                  className={btn}
                  data-testid={`verify-${s.slug}`}
                  onClick={() =>
                    start(async () => {
                      if ((await setSpotVerified(s.slug, !s.verified)).ok) setSpots((l) => l.map((x) => (x.slug === s.slug ? { ...x, verified: !x.verified } : x)));
                    })
                  }
                >
                  {s.verified ? t("unverifyBtn") : t("verifyBtn")}
                </button>
              </li>
            ))}
        </ul>
      </section>
    </div>
  );
}
