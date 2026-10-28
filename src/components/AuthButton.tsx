"use client";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth";

export function AuthButton() {
  const t = useTranslations("nav");
  const { user, profile, loading, configured } = useAuth();
  if (!configured || loading) return <span className="inline-block w-16" aria-hidden />;
  if (!user)
    return (
      <Link href="/signin" className="whitespace-nowrap rounded-full px-2 py-1.5 hover:bg-paper-2 sm:px-3">
        {t("signIn")}
      </Link>
    );
  const initial = (profile?.display_name ?? user.email ?? "?").trim().charAt(0).toUpperCase();
  return (
    <Link href="/profile" aria-label={t("profile")} className="grid size-8 place-items-center rounded-full bg-pen font-medium text-paper">
      {initial}
    </Link>
  );
}
