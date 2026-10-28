"use client";
import { useTodayCounts } from "@/lib/social";

export function TodayCount({ label }: { label: string }) {
  const { total, ready } = useTodayCounts();
  if (!ready) return null;
  return (
    <span className="flex items-center gap-2 whitespace-nowrap rounded-full px-2 py-1.5 sm:px-3" title={label}>
      <span className={`inline-block size-2 rounded-full bg-highlight ${total > 0 ? "pulse" : "opacity-50"}`} aria-hidden />
      <span className="tabular-nums">{total}</span>
      <span className="hidden text-pencil sm:inline">{label}</span>
    </span>
  );
}
