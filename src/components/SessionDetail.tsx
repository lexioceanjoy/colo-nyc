"use client";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Suspense, useCallback, useEffect, useState } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { formatSessionTime } from "@/lib/hours";
import { fetchPublicSessions, report, type PersonCard, type PublicSession } from "@/lib/social";
import { RsvpButton } from "./SessionCard";
import { hostOf } from "./SpotSocial";

type Attendee = { user_id: string; profiles: PersonCard | null };
type SpotRef = { slug: string; name: string; hood: string; address: string } | null;

function Detail({ initial, spot, created }: { initial: PublicSession; spot: SpotRef; created: boolean }) {
  const t = useTranslations("sessions");
  const tc = useTranslations("checkin");
  const locale = useLocale();
  const router = useRouter();
  const { user } = useAuth();
  const [s, setS] = useState(initial);
  const [hostId, setHostId] = useState<string | null>(null);
  const [people, setPeople] = useState<Attendee[]>([]);
  const [msg, setMsg] = useState<string | null>(created ? t("form.created") : null);

  const load = useCallback(async () => {
    const [fresh] = await fetchPublicSessions({ id: initial.id });
    if (fresh) setS(fresh);
    const sb = supabaseBrowser();
    if (!sb || !user) return;
    const [{ data: sess }, { data: rs }] = await Promise.all([
      sb.from("sessions").select("host_id").eq("id", initial.id).maybeSingle(),
      sb.from("rsvps").select("user_id,profiles(display_name,headline,link_url,community_tags)").eq("session_id", initial.id).order("created_at"),
    ]);
    setHostId(sess?.host_id ?? null);
    setPeople((rs as unknown as Attendee[]) ?? []);
  }, [initial.id, user]);

  useEffect(() => {
    const id = setTimeout(load, 0);
    return () => clearTimeout(id);
  }, [load]);

  const isHost = Boolean(user && hostId === user.id);
  const amGoing = Boolean(user && people.some((p) => p.user_id === user.id));

  return (
    <article className="mx-auto w-full max-w-2xl px-4 py-12" data-testid="session-detail">
      <Link href="/sessions" className="text-sm text-pen hover:underline">
        ← {t("title")}
      </Link>
      <h1 className="mt-4 font-serif text-4xl leading-tight">
        {s.title}
        {s.community_tag === "next_play" && <span className="ml-3 rounded-full bg-pen-soft px-2 align-middle font-sans text-sm">Next Play</span>}
      </h1>
      <dl className="mt-4 space-y-1">
        <div className="flex gap-2">
          <dt className="text-pencil">{t("when")}</dt>
          <dd>{formatSessionTime(s.starts_at, s.ends_at, locale)}</dd>
        </div>
        {spot && (
          <div className="flex gap-2">
            <dt className="text-pencil">{t("where")}</dt>
            <dd>
              <Link href={`/spot/${spot.slug}`} className="text-pen underline">
                {spot.name}
              </Link>{" "}
              <span className="text-pencil">· {spot.hood}</span>
            </dd>
          </div>
        )}
      </dl>
      {s.description && <p className="mt-4 whitespace-pre-line leading-relaxed">{s.description}</p>}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <span className="font-serif text-2xl tabular-nums" data-testid="going-count">
          {t("going", { going: s.rsvp_count, capacity: s.capacity })}
        </span>
        {!isHost && <RsvpButton s={s} user={user} onChange={load} />}
        {isHost && <span className="rounded-full bg-pen-soft px-3 py-1 text-sm">{t("yourSession")}</span>}
        <button
          type="button"
          className="rounded-full border border-rule px-3 py-1.5 text-sm"
          onClick={async () => {
            await navigator.clipboard?.writeText(window.location.href.split("?")[0]);
            setMsg(t("copied"));
          }}
        >
          {t("share")}
        </button>
      </div>

      {user && (isHost || amGoing) && people.length > 0 && (
        <section className="mt-8">
          <h2 className="font-serif text-2xl">{t("attendees")}</h2>
          <ul className="mt-3 space-y-2" data-testid="attendees">
            {people.map((p) => (
              <li key={p.user_id} className="rounded-lg bg-paper-2 px-3 py-2">
                <p className="font-medium">
                  {p.profiles?.display_name}
                  {p.user_id === hostId && <span className="text-pencil"> · host</span>}
                </p>
                {p.profiles?.headline && <p className="text-sm text-pencil">{p.profiles.headline}</p>}
                {hostOf(p.profiles?.link_url ?? null) && (
                  <a href={p.profiles!.link_url!} target="_blank" rel="noopener noreferrer nofollow ugc" className="text-sm text-pen underline">
                    {hostOf(p.profiles!.link_url)}
                  </a>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {user && (
        <p className="mt-8 flex gap-4 text-sm">
          {isHost ? (
            <button
              type="button"
              className="text-warn underline"
              onClick={async () => {
                await supabaseBrowser()?.from("sessions").delete().eq("id", s.id);
                router.push("/sessions");
              }}
            >
              {t("delete")}
            </button>
          ) : (
            <button
              type="button"
              className="text-pencil underline"
              onClick={async () => {
                await report("session", s.id);
                setMsg(tc("reported"));
              }}
            >
              {t("report")}
            </button>
          )}
        </p>
      )}
      {msg && (
        <p role="status" className="mt-4 rounded-lg bg-paper-2 px-3 py-2 text-sm">
          {msg}
        </p>
      )}
    </article>
  );
}

function WithParams(props: { initial: PublicSession; spot: SpotRef }) {
  return <Detail {...props} created={useSearchParams().has("created")} />;
}

export function SessionDetail(props: { initial: PublicSession; spot: SpotRef }) {
  return (
    <Suspense fallback={<Detail {...props} created={false} />}>
      <WithParams {...props} />
    </Suspense>
  );
}
