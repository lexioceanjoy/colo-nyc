"use server";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { CATEGORIES } from "@/lib/schema";
import { getAllSpots } from "@/lib/spots";
import { NEIGHBORHOODS } from "@/data/neighborhoods";
import { cleanAnswers, isDuplicate } from "@/lib/suggest";
import { flags } from "@/config/flags";

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

export type SubmitResult = { ok: true } | { ok: false; error: "limit" | "invalid" | "auth" | "server" | "duplicate"; slug?: string };

/**
 * Suggest a spot (Phase 2). Anonymous: 5/day per hashed IP; signed-in: 5/day per user. Duplicates (same name in the
 * same neighborhood, on the map or already suggested) are skipped. Answers for the 5 core details are stored with
 * the suggestion and become the submitter's visitor reports when the spot is added (signed-in submitters only).
 */
export async function submitSpot(form: FormData): Promise<SubmitResult> {
  if (str(form.get("website"), 200)) return { ok: true }; // honeypot: pretend success for bots
  const name = str(form.get("name"), 120);
  const addr = str(form.get("address_or_link"), 300);
  const category = str(form.get("category"), 20);
  const why = str(form.get("why"), 300);
  const hoodRaw = str(form.get("neighborhood"), 40);
  const neighborhood = hoodRaw && hoodRaw in NEIGHBORHOODS ? hoodRaw : null;
  if (!name || !addr || !(CATEGORIES as readonly string[]).includes(category)) return { ok: false, error: "invalid" };

  const onMap = getAllSpots().find((s) => !s.closed && isDuplicate({ name, neighborhood }, s));
  if (onMap) return { ok: false, error: "duplicate", slug: onMap.slug };

  const user = await currentUser();
  const allowed = user ? await bumpLimit(`submit:user:${user.id}`, 5) : await anonAllowed("submit");
  if (!allowed) return { ok: false, error: "limit" };

  const db = supabaseAdmin();
  if (flags.suggestFlow) {
    // Already suggested and still pending? Don't queue it twice.
    const { data: pending } = await db.from("spot_submissions").select("id,name,submission_extras(neighborhood,intake_slug)").in("status", ["new", "accepted"]).limit(500);
    const dup = (pending ?? []).some((p) => {
      // One-to-one relation: PostgREST may return it as an object or a single-item array.
      const rel = (p as unknown as { submission_extras: unknown }).submission_extras;
      const x = (Array.isArray(rel) ? rel[0] : rel) as { neighborhood: string | null; intake_slug: string | null } | null | undefined;
      return !x?.intake_slug && isDuplicate({ name, neighborhood }, { name: p.name as string, neighborhood: x?.neighborhood ?? null });
    });
    if (dup) return { ok: false, error: "duplicate" };
  }

  const { data: row, error } = await db
    .from("spot_submissions")
    .insert({ name, address_or_link: addr, category, why: why || null, user_id: user?.id ?? null })
    .select("id")
    .single();
  if (error || !row) return { ok: false, error: "server" };
  if (flags.suggestFlow) {
    const raw: Record<string, unknown> = {};
    for (const k of ["wifi", "outlets", "laptopPolicy", "noise", "hours"]) raw[k] = form.get(`a_${k}`);
    const answers = cleanAnswers(raw);
    const { error: e2 } = await db.from("submission_extras").insert({ submission_id: row.id, neighborhood, answers, credit: Boolean(user && form.get("credit")) });
    if (e2) console.warn("[submission_extras]", e2.message); // the suggestion itself is saved either way
  }
  return { ok: true };
}

async function bumpLimit(key: string, max: number): Promise<boolean> {
  const { data, error } = await supabaseAdmin().rpc("bump_rate_limit", { p_key: key, p_max: max });
  return !error && data === true;
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
