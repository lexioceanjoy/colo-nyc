"use client";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Suspense, useState } from "react";
import { useRouter, Link } from "@/i18n/navigation";
import { useAuth, type Profile } from "@/lib/auth";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { deleteAccount } from "@/app/actions";

const field = "mt-1 w-full rounded-lg border border-rule bg-paper px-3 py-2";

function Form({ onboarding, next }: { onboarding: boolean; next: string | null }) {
  const t = useTranslations("profile");
  const ta = useTranslations("auth");
  const locale = useLocale() as "en" | "zh";
  const router = useRouter();
  const { user, profile, loading, reloadProfile } = useAuth();
  const [msg, setMsg] = useState<string | null>(null);
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  if (loading) return <p className="text-pencil">…</p>;
  if (!user)
    return (
      <p>
        <Link href={`/signin?next=/${locale}/profile`} className="text-pen underline">
          {ta("google")}
        </Link>
      </p>
    );

  const p: Partial<Profile> = profile ?? { display_name: (user.user_metadata?.full_name as string | undefined)?.split(" ")[0] ?? "", locale };

  async function save(form: FormData) {
    const sb = supabaseBrowser();
    if (!sb || !user) return;
    const display_name = String(form.get("display_name") ?? "").trim();
    const headline = String(form.get("headline") ?? "").trim() || null;
    const link_url = String(form.get("link_url") ?? "").trim() || null;
    if (!display_name || display_name.length > 40) return setMsg(t("errorName"));
    if (link_url && !/^https:\/\/\S+$/.test(link_url)) return setMsg(t("errorLink"));
    setBusy(true);
    const { error } = await sb.from("profiles").upsert({
      id: user.id,
      display_name,
      headline,
      link_url,
      community_tags: form.get("next_play") ? ["next_play"] : [],
      locale: form.get("locale") === "zh" ? "zh" : "en",
    });
    setBusy(false);
    if (error) return setMsg(error.message);
    await reloadProfile();
    setMsg(t("saved"));
    if (onboarding && next) router.push(next.replace(/^\/(en|zh)/, ""));
  }

  return (
    <>
      <h1 className="font-serif text-3xl">{onboarding ? t("onboardingTitle") : t("title")}</h1>
      {onboarding && <p className="mt-2 text-pencil">{t("onboardingLede")}</p>}
      <form action={save} className="mt-6 space-y-4" data-testid="profile-form">
        <label className="block">
          <span>{t("displayName")}</span>
          <input name="display_name" required maxLength={40} defaultValue={p.display_name ?? ""} className={field} />
          <span className="text-sm text-pencil">{t("displayNameHint")}</span>
        </label>
        <label className="block">
          <span>{t("headline")}</span>
          <input name="headline" maxLength={80} defaultValue={p.headline ?? ""} placeholder={t("headlinePh")} className={field} />
        </label>
        <label className="block">
          <span>{t("link")}</span>
          <input name="link_url" type="url" maxLength={200} pattern="https://.+" defaultValue={p.link_url ?? ""} placeholder="https://" className={field} />
          <span className="text-sm text-pencil">{t("linkHint")}</span>
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="next_play" defaultChecked={p.community_tags?.includes("next_play")} className="accent-[var(--pen)]" />
          {t("nextPlay")}
        </label>
        <label className="block">
          <span>{t("language")}</span>
          <select name="locale" defaultValue={p.locale ?? locale} className={field}>
            <option value="en">English</option>
            <option value="zh">中文</option>
          </select>
        </label>
        <p className="text-sm">{ta("note")}</p>
        <button disabled={busy} className="rounded-full bg-pen px-5 py-2.5 text-paper disabled:opacity-50">
          {t("save")}
        </button>
        {msg && <p role="status">{msg}</p>}
      </form>

      {profile && (
        <section className="mt-12 rounded-2xl border border-rule p-5" aria-labelledby="danger">
          <h2 id="danger" className="font-serif text-xl">{t("dangerTitle")}</h2>
          <p className="mt-1 text-sm text-pencil">{t("dangerBody")}</p>
          <label className="mt-3 block text-sm">
            {t("deleteConfirm")}
            <input value={confirm} onChange={(e) => setConfirm(e.target.value)} className={field} autoComplete="off" />
          </label>
          <button
            type="button"
            disabled={confirm !== "DELETE" || busy}
            onClick={async () => {
              setBusy(true);
              const r = await deleteAccount();
              setBusy(false);
              if (r.ok) {
                await supabaseBrowser()?.auth.signOut();
                router.push("/");
              }
            }}
            className="mt-3 rounded-full border border-warn px-4 py-2 text-warn disabled:opacity-40"
          >
            {t("delete")}
          </button>
        </section>
      )}
      <p className="mt-8 text-sm">
        <Link href="/privacy" className="text-pen underline">
          {ta("privacyLink")}
        </Link>
      </p>
    </>
  );
}

function WithParams() {
  const sp = useSearchParams();
  return <Form onboarding={sp.has("onboarding")} next={sp.get("next")} />;
}

export function ProfileForm() {
  return (
    <Suspense fallback={null}>
      <WithParams />
    </Suspense>
  );
}
