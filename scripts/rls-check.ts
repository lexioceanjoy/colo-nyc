/**
 * RLS verification with the ANON key only (SPEC §11 M3): anonymous clients get counts, never names.
 * Seeds one check-in with the service role, then probes as anon. Runs against whatever NEXT_PUBLIC_SUPABASE_URL is set
 * (e2e:social points it at the TEST project).
 */
import "./lib/env";
import { createClient } from "@supabase/supabase-js";
import { requireEnv } from "./lib/env";

const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
const anon = createClient(url, requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"), { auth: { persistSession: false } });
const svc = createClient(url, requireEnv("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false } });

// Per run (E2E_RUN_ID from scripts/e2e-social.ts), so parallel runs on the shared TEST project don't share a probe.
const run = process.env.E2E_RUN_ID ?? "local";
const email = `rls-probe-${run}@colo-nyc.test`;
const probeSpot = `rls-probe-${run}`;
const { data: created } = await svc.auth.admin.createUser({ email, password: crypto.randomUUID(), email_confirm: true });
const uid = created.user?.id ?? (await svc.auth.admin.listUsers()).data.users.find((u) => u.email === email)!.id;
await svc.from("profiles").upsert({ id: uid, display_name: "RLS Probe" });
await svc.from("checkins").delete().eq("user_id", uid);
await svc.from("checkins").insert({ user_id: uid, spot_slug: probeSpot, window: "all_day" });

const checks: [string, boolean][] = [];
const p = await anon.from("profiles").select("display_name");
checks.push(["anon cannot select profiles (names)", Boolean(p.error) || (p.data ?? []).length === 0]);
const c = await anon.from("checkins").select("*");
checks.push(["anon cannot select check-ins", Boolean(c.error) || (c.data ?? []).length === 0]);
const r = await anon.from("rsvps").select("*");
checks.push(["anon cannot select RSVPs", Boolean(r.error) || (r.data ?? []).length === 0]);
const s = await anon.from("sessions").select("host_id");
checks.push(["anon cannot select sessions.host_id", Boolean(s.error) || (s.data ?? []).length === 0]);
const ins = await anon.from("checkins").insert({ user_id: uid, spot_slug: "x", window: "all_day" });
checks.push(["anon cannot insert check-ins", Boolean(ins.error)]);
const tc = await anon.rpc("today_counts");
const row = (tc.data as { spot_slug: string; count: number }[] | null)?.find((x) => x.spot_slug === probeSpot);
checks.push(["anon gets today_counts() aggregate", !tc.error && Number(row?.count) >= 1]);
checks.push(["today_counts() exposes no names", !JSON.stringify(tc.data ?? []).includes("RLS Probe")]);
const ps = await anon.from("public_sessions").select("*").limit(1);
checks.push(["anon can read public_sessions (no identities)", !ps.error && !JSON.stringify(ps.data ?? []).match(/host_id|user_id/)]);

await svc.auth.admin.deleteUser(uid); // cascade cleans the probe rows
let failed = 0;
for (const [name, ok] of checks) {
  console.log(`${ok ? "✓" : "✗"} RLS: ${name}`);
  if (!ok) failed++;
}
process.exit(failed ? 1 : 0);
