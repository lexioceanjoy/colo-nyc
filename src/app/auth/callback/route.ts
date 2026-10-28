import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin, adminEmails } from "@/lib/supabase/admin";

/** OAuth (PKCE) callback: exchange the code, seed admins from ADMIN_EMAILS, then go to onboarding or `next`. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const locale = searchParams.get("locale") === "zh" ? "zh" : "en";
  // Only same-site relative paths are allowed as `next` (no open redirects).
  const nextParam = searchParams.get("next") ?? "";
  const next = /^\/(en|zh)(\/[\w\-/]*)?(\?[\w=&%\-,.]*)?$/.test(nextParam) ? nextParam : `/${locale}`;
  if (!code) return NextResponse.redirect(`${origin}/${locale}/signin?error=1`);

  const supabase = await supabaseServer();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) return NextResponse.redirect(`${origin}/${locale}/signin?error=1`);

  const user = data.user;
  const admin = supabaseAdmin();
  // Admin checks use the admins table (RLS can't read env vars), seeded here from ADMIN_EMAILS (SPEC §4.4).
  if (user.email && adminEmails().includes(user.email.toLowerCase())) {
    await admin.from("admins").upsert({ user_id: user.id }, { onConflict: "user_id" });
  }
  const { data: profile } = await admin.from("profiles").select("id").eq("id", user.id).maybeSingle();
  const dest = profile ? next : `/${locale}/profile?onboarding=1&next=${encodeURIComponent(next)}`;
  return NextResponse.redirect(`${origin}${dest}`);
}
