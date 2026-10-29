import { getTranslations, setRequestLocale } from "next-intl/server";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getVisibleSpots } from "@/lib/spots";
import { AdminPanel, type AdminData } from "@/components/AdminPanel";

// Dynamic on purpose: reads the session cookie and checks the admins table (SPEC §6.7).
export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false } };

export default async function Admin({ params }: PageProps<"/[locale]/admin">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");
  const sb = await supabaseServer();
  const { data: auth } = await sb.auth.getUser();
  const db = supabaseAdmin();
  const isAdmin = auth.user
    ? Boolean((await db.from("admins").select("user_id").eq("user_id", auth.user.id).maybeSingle()).data)
    : false;
  if (!isAdmin)
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="font-serif text-3xl">{t("title")}</h1>
        <p className="mt-2 text-pencil">{t("notAdmin")}</p>
      </div>
    );

  const [subs, corr, hc, hs, hp, ov, cr] = await Promise.all([
    db.from("spot_submissions").select("*").eq("status", "new").order("created_at", { ascending: false }).limit(100),
    db.from("corrections").select("*").eq("status", "new").order("created_at", { ascending: false }).limit(100),
    db.from("checkins").select("id,spot_slug,note,ny_date").eq("hidden", true).limit(50),
    db.from("sessions").select("id,spot_slug,title,starts_at").eq("hidden", true).limit(50),
    db.from("profiles").select("id,display_name,headline").eq("hidden", true).limit(50),
    db.from("spot_overrides").select("slug,status"),
    db.rpc("crowd_details"),
  ]);
  const overrides = Object.fromEntries((ov.data ?? []).map((o) => [o.slug, o.status]));
  const data: AdminData = {
    submissions: subs.data ?? [],
    corrections: corr.data ?? [],
    hidden: [
      ...(hc.data ?? []).map((r) => ({ table: "checkins" as const, id: r.id, label: `Check-in @ ${r.spot_slug} ${r.ny_date}: ${r.note ?? ""}` })),
      ...(hs.data ?? []).map((r) => ({ table: "sessions" as const, id: r.id, label: `Session "${r.title}" @ ${r.spot_slug}` })),
      ...(hp.data ?? []).map((r) => ({ table: "profiles" as const, id: r.id, label: `Profile ${r.display_name} · ${r.headline ?? ""}` })),
    ],
    crowd: ((cr.data as { spot_slug: string; field: string; value: string; reports: number; total: number; disagree: boolean }[] | null) ?? []).map((r) => ({
      ...r,
      reports: Number(r.reports),
      total: Number(r.total),
    })),
    spots: (await getVisibleSpots()).map((s) => ({ slug: s.slug, name: s.name, verified: (overrides[s.slug] ?? s.status) === "verified" })),
  };
  return <AdminPanel data={data} />;
}
