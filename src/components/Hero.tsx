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
export function Hero({ count, variant = "bar" }: { count: number; variant?: "bar" | "overlay" }) {
  const t = useTranslations("hero");
  const hidden = useSyncExternalStore(subscribe, dismissed, () => false);
  if (hidden) return null;
  const dismiss = () => {
    try {
      localStorage.setItem(KEY, "1");
    } catch {}
    listeners.forEach((l) => l());
  };
  const shell =
    variant === "bar"
      ? "hidden border-b border-rule bg-paper px-4 py-4 lg:block"
      : "absolute inset-x-3 top-3 z-10 rounded-2xl border border-rule bg-paper/95 px-4 py-3 shadow-sm backdrop-blur lg:hidden";
  return (
    <div className={shell}>
      <div className="mx-auto flex max-w-[1600px] items-start gap-4">
        <div className="flex-1">
          <p className={`font-serif leading-tight ${variant === "bar" ? "text-3xl" : "text-xl"} [&_em]:not-italic [&_em]:text-pen [&_em]:underline [&_em]:decoration-1 [&_em]:underline-offset-4`}>
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
