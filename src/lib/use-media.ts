"use client";
import { useSyncExternalStore } from "react";

/** True at Tailwind's `lg` breakpoint and up. Server snapshot is null (unknown), so nothing layout-specific mounts before hydration. */
export function useIsDesktop(): boolean | null {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia("(min-width: 1024px)");
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia("(min-width: 1024px)").matches,
    () => null,
  );
}
