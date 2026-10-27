"use client";
import { useTodayCounts } from "@/lib/social";

export function TodayCount({ label }: { label: string }) {
  const { total, ready } = useTodayCounts();
  if (!ready) return null;
  return (
    <span className="flex items-center gap-2 rounded-full px-3 py-1.5" title={label}>
      <span className={`inline-block size-2 rounded-full bg-highlight ${total > 0 ? "pulse" : "opacity-50"}`} aria-hidden />
      <span className="tabular-nums">{total}</span>
      <span className="text-pencil">{label}</span>
    </span>
  );
}
