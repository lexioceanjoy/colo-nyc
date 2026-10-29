"use server";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { CATEGORIES } from "@/lib/schema";
import { getAllSpots } from "@/lib/spots";

type Result = { ok: true } | { ok: false; error: "limit" | "invalid" | "auth" | "server" };

async function currentUser() {
  const sb = await supabaseServer();
  const { data } = await sb.auth.getUser();
  return data.user;
}

/** "Delete my account": auth.admin.deleteUser, and FK cascades remove everything else (SPEC §4.4). */
export async function deleteAccount(): Promise<Result> {
  const user = await currentUser();
  if (!user) return { ok: false, error: "auth" };
  const { error } = await supabaseAdmin().auth.admin.deleteUser(user.id);
  if (error) return { ok: false, error: "server" };
  const sb = await supabaseServer();
  await sb.auth.signOut();
  return { ok: true };
}

/** Anonymous writes are rate-limited by sha256(ip + salt), 5/day (SPEC §4.4). The raw IP is never stored. */
async function anonAllowed(scope: string): Promise<boolean> {
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || "unknown";
  const key = `${scope}:` + createHash("sha256").update(ip + (process.env.IP_HASH_SALT ?? "")).digest("hex");
  const { data, error } = await supabaseAdmin().rpc("bump_rate_limit", { p_key: key, p_max: 5 });
  return !error && data === true;
}

const str = (v: FormDataEntryValue | null, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function submitSpot(form: FormData): Promise<Result> {
  if (str(form.get("website"), 200)) return { ok: true }; // honeypot: pretend success for bots
  const name = str(form.get("name"), 120);
  const addr = str(form.get("address_or_link"), 300);
  const category = str(form.get("category"), 20);
  const why = str(form.get("why"), 300);
  if (!name || !addr || !(CATEGORIES as readonly string[]).includes(category)) return { ok: false, error: "invalid" };
  if (!(await anonAllowed("submit"))) return { ok: false, error: "limit" };
  const user = await currentUser();
  const { error } = await supabaseAdmin()
    .from("spot_submissions")
    .insert({ name, address_or_link: addr, category, why: why || null, user_id: user?.id ?? null });
  return error ? { ok: false, error: "server" } : { ok: true };
}

const CORRECTION_FIELDS = ["hours", "wifi", "outlets", "seating", "noise", "laptopPolicy", "timeLimitMin", "callsOk", "groupCapacity", "restroom", "closed", "other"];

export async function submitCorrection(form: FormData): Promise<Result> {
  if (str(form.get("website"), 200)) return { ok: true };
  const slug = str(form.get("spot_slug"), 80);
  const field = str(form.get("field"), 40);
  const suggested = str(form.get("suggested"), 200);
  if (!getAllSpots().some((s) => s.slug === slug) || !CORRECTION_FIELDS.includes(field) || !suggested) return { ok: false, error: "invalid" };
  if (!(await anonAllowed("correction"))) return { ok: false, error: "limit" };
  const user = await currentUser();
  const { error } = await supabaseAdmin().from("corrections").insert({ spot_slug: slug, field, suggested, user_id: user?.id ?? null });
  return error ? { ok: false, error: "server" } : { ok: true };
}

// ───────────── Admin (checked against the admins table, then service role) ─────────────

async function requireAdmin() {
  const user = await currentUser();
  if (!user) return null;
  const { data } = await supabaseAdmin().from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
  return data ? user : null;
}

export async function setSpotVerified(slug: string, verified: boolean): Promise<Result> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "auth" };
  if (!getAllSpots().some((s) => s.slug === slug)) return { ok: false, error: "invalid" };
  const db = supabaseAdmin();
  const name = (admin.user_metadata?.full_name as string | undefined)?.split(" ")[0] ?? "Lexi";
  const { error } = verified
    ? await db.from("spot_overrides").upsert({ slug, status: "verified", verified_by: name, verified_at: new Date().toISOString() })
    : await db.from("spot_overrides").upsert({ slug, status: "ai_researched", verified_by: null, verified_at: null });
  return error ? { ok: false, error: "server" } : { ok: true };
}

export async function setReviewStatus(table: "spot_submissions" | "corrections", id: string, status: "accepted" | "rejected"): Promise<Result> {
  if (!(await requireAdmin())) return { ok: false, error: "auth" };
  const { error } = await supabaseAdmin().from(table).update({ status }).eq("id", id);
  return error ? { ok: false, error: "server" } : { ok: true };
}

export async function unhide(table: "checkins" | "sessions" | "profiles", id: string): Promise<Result> {
  if (!(await requireAdmin())) return { ok: false, error: "auth" };
  const db = supabaseAdmin();
  const { error } = await db.from(table).update({ hidden: false }).eq("id", id);
  if (!error) await db.from("reports").delete().eq("target_id", id); // reset the 2-report counter
  return error ? { ok: false, error: "server" } : { ok: true };
}

// ───────────── Phase 1: crowd reports ─────────────

/** After a signed-in user reports a detail, refresh that spot and the lists so it shows at once (no deploy). */
export async function revalidateSpot(slug: string): Promise<Result> {
  const user = await currentUser();
  if (!user) return { ok: false, error: "auth" };
  if (!getAllSpots().some((s) => s.slug === slug)) return { ok: false, error: "invalid" };
  for (const l of ["en", "zh"]) {
    revalidatePath(`/${l}/spot/${slug}`);
    revalidatePath(`/${l}`);
  }
  return { ok: true };
}

/** Admin: clear all reports for one spot detail (Phase 1 guard). */
export async function resetDetail(slug: string, field: string): Promise<Result> {
  if (!(await requireAdmin())) return { ok: false, error: "auth" };
  if (!["wifi", "outlets", "laptopPolicy", "noise", "hours"].includes(field)) return { ok: false, error: "invalid" };
  const { error } = await supabaseAdmin().from("detail_votes").delete().eq("spot_slug", slug).eq("field", field);
  if (error) return { ok: false, error: "server" };
  for (const l of ["en", "zh"]) {
    revalidatePath(`/${l}/spot/${slug}`);
    revalidatePath(`/${l}`);
  }
  return { ok: true };
}
