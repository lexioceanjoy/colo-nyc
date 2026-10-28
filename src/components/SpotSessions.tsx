"use client";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth";
import { fetchPublicSessions, type PublicSession } from "@/lib/social";
import { SessionCard } from "./SessionCard";

export function SpotSessions({ slug }: { slug: string }) {
  const t = useTranslations("sessions");
  const { user } = useAuth();
  const [list, setList] = useState<PublicSession[]>([]);
  const load = useCallback(() => fetchPublicSessions({ slug }).then(setList), [slug]);
  useEffect(() => {
    const id = setTimeout(load, 0);
    return () => clearTimeout(id);
  }, [load]);
  return (
    <div className="mt-6 border-t border-rule pt-4">
      {list.length > 0 && <h3 className="font-serif text-lg">{t("upcoming")}</h3>}
      {list.length > 0 && (
        <ul className="mt-2 space-y-3">
          {list.map((s) => (
            <SessionCard key={s.id} s={s} spotName="" user={user} onChange={load} />
          ))}
        </ul>
      )}
      <Link href={`/sessions/new?spot=${slug}`} className="mt-3 inline-block text-sm text-pen underline" data-testid="host-here">
        {t("hostHere")}
      </Link>
    </div>
  );
}
