"use client";
import { useTranslations } from "next-intl";
import { useState } from "react";

/** "Share": native share sheet with the 3:4 card image on phones (great for 小红书), download elsewhere. */
export function ShareCard({ cardUrl, pageUrl, title, filename }: { cardUrl: string; pageUrl: string; title: string; filename: string }) {
  const t = useTranslations("spot");
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      data-testid="share-card"
      onClick={async () => {
        setBusy(true);
        try {
          const blob = await (await fetch(cardUrl)).blob();
          const file = new File([blob], filename, { type: "image/png" });
          const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
          if (nav.canShare?.({ files: [file] })) await nav.share({ files: [file], title, url: pageUrl });
          else {
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = filename;
            a.click();
            URL.revokeObjectURL(a.href);
          }
        } catch {
          // User cancelled the share sheet: nothing to do.
        } finally {
          setBusy(false);
        }
      }}
      className="rounded-full border border-rule px-4 py-2 hover:border-pen disabled:opacity-50"
    >
      {t("share")}
    </button>
  );
}
