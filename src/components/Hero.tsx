"use client";
import { useTranslations } from "next-intl";
import { useSyncExternalStore } from "react";

const KEY = "colo.hero.dismissed";
const listeners = new Set<() => void>();

function dismissed(): boolean {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

// First-visit hero line, dismissible (SPEC §6.1). Rendered on the server (no layout shift for first visits); hidden after hydration if dismissed.
export function Hero({ count }: { count: number }) {
  const t = useTranslations("hero");
  const hidden = useSyncExternalStore(subscribe, dismissed, () => false);
  if (hidden) return null;
  const dismiss = () => {
    try {
      localStorage.setItem(KEY, "1");
    } catch {}
    listeners.forEach((l) => l());
  };
  return (
    <div className="border-b border-rule bg-paper px-4 py-4">
      <div className="mx-auto flex max-w-[1600px] items-start gap-4">
        <div className="flex-1">
          <p className="font-serif text-2xl leading-tight sm:text-3xl [&_em]:text-pen">
            {t.rich("line", { em: (c) => <em>{c}</em> })}
          </p>
          <p className="mt-1 text-sm text-pencil">{t("sub", { count })}</p>
        </div>
        <button type="button" onClick={dismiss} className="shrink-0 rounded-full border border-rule px-3 py-1.5 text-sm hover:border-pen">
          {t("dismiss")}
        </button>
      </div>
    </div>
  );
}
