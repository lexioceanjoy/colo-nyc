"use client";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Suspense, useState } from "react";
import { Link } from "@/i18n/navigation";
import { signInWithGoogle } from "@/lib/auth";
import { supabaseBrowser } from "@/lib/supabase/browser";

function Panel({ next, error }: { next: string; error: boolean }) {
  const t = useTranslations("auth");
  const locale = useLocale();
  const [busy, setBusy] = useState(false);
  const configured = Boolean(supabaseBrowser());
  return (
    <section className="rounded-2xl border border-rule p-6" aria-labelledby="signin-title">
      <h1 id="signin-title" className="font-serif text-3xl">{t("title")}</h1>
      <p className="mt-2 text-pencil">{t("lede")}</p>
      {error && <p role="alert" className="mt-4 rounded-lg bg-paper-2 px-3 py-2 text-sm">{t("error")}</p>}
      <button
        type="button"
        disabled={!configured || busy}
        onClick={() => {
          setBusy(true);
          signInWithGoogle(locale, next).catch(() => setBusy(false));
        }}
        className="mt-6 flex w-full items-center justify-center gap-3 rounded-full bg-ink px-5 py-3 text-paper disabled:opacity-50"
      >
        <svg viewBox="0 0 48 48" className="size-5" aria-hidden>
          <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.5l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.6 5.4 2.7 13.2l7.8 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
          <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 7l7.4 5.7c4.3-4 6.9-9.9 6.9-17.2z" />
          <path fill="#FBBC05" d="M10.5 28.7c-.5-1.4-.8-3-.8-4.7s.3-3.2.8-4.7l-7.8-6.1C1 16.6 0 20.2 0 24s1 7.4 2.7 10.8l7.8-6.1z" />
          <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.7c-2.1 1.4-4.8 2.3-8.5 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.8 6.1C6.6 42.6 14.6 48 24 48z" />
        </svg>
        {t("google")}
      </button>
      {!configured && <p className="mt-2 text-sm text-pencil">{t("unavailable")}</p>}
      <p className="mt-6 text-sm">{t("note")}</p>
      <p className="mt-3 text-sm">
        <Link href="/privacy" className="text-pen underline underline-offset-2" data-testid="signin-privacy">
          {t("privacyLink")}
        </Link>
      </p>
    </section>
  );
}

function WithParams() {
  const sp = useSearchParams();
  const locale = useLocale();
  const raw = sp.get("next") ?? "";
  return <Panel next={raw.startsWith(`/${locale}`) ? raw : `/${locale}`} error={sp.has("error")} />;
}

export function SignInPanel() {
  return (
    <Suspense fallback={<Panel next="/" error={false} />}>
      <WithParams />
    </Suspense>
  );
}
