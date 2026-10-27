"use client";
import { useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import { Suspense } from "react";
import { Link, usePathname } from "@/i18n/navigation";

type Props = { label: string; ariaLabel: string };

function ToggleLink({ label, ariaLabel, query }: Props & { query: string }) {
  const locale = useLocale();
  const pathname = usePathname();
  const other = locale === "en" ? "zh" : "en";
  return (
    <Link
      href={query ? `${pathname}?${query}` : pathname}
      locale={other}
      lang={other === "zh" ? "zh-Hans" : "en"}
      aria-label={ariaLabel}
      className="rounded-full border border-rule px-3 py-1.5 font-medium hover:border-pen hover:text-pen"
    >
      {label}
    </Link>
  );
}

function WithQuery(props: Props) {
  return <ToggleLink {...props} query={useSearchParams().toString()} />;
}

/** Switches locale and keeps the filter query, so shared filter links survive the toggle. */
export function LocaleToggle(props: Props) {
  return (
    <Suspense fallback={<ToggleLink {...props} query="" />}>
      <WithQuery {...props} />
    </Suspense>
  );
}
