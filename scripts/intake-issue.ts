/**
 * Weekly (refresh Action): count accepted suggestions waiting for intake and print a GitHub issue body.
 * No AI or LLM calls; the workflow opens or updates one issue with this text so Lexi knows to run intake.
 */
import "./lib/env";
import { appendFileSync, writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { requireEnv } from "./lib/env";

const db = createClient(requireEnv("NEXT_PUBLIC_SUPABASE_URL"), requireEnv("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false } });
const { data, error } = await db.from("spot_submissions").select("id,name,submission_extras(intake_slug)").eq("status", "accepted");
if (error) {
  console.warn(`intake-issue: skipped (${error.message})`);
  process.exit(0);
}
const waiting = (data ?? []).filter((r) => {
  const rel = (r as unknown as { submission_extras: unknown }).submission_extras;
  const x = (Array.isArray(rel) ? rel[0] : rel) as { intake_slug: string | null } | null;
  return !x?.intake_slug;
});
const body = [
  `**${waiting.length} accepted suggestion(s) waiting for intake.**`,
  "",
  ...waiting.slice(0, 50).map((w) => `- ${w.name}`),
  "",
  "Run in a Claude Code session: `pnpm data:intake`, research with `data/intake/PROMPT.md`, then `pnpm data:intake --finalize`.",
  "(Updated by the weekly refresh. No AI runs in GitHub Actions.)",
].join("\n");
writeFileSync(".intake-issue.md", body + "\n");
console.log(`intake-issue: ${waiting.length} waiting`);
if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `waiting=${waiting.length}\n`);
