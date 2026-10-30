/**
 * pnpm e2e:social — builds the app against the Supabase TEST project and runs the social E2E + RLS checks.
 * Never touches production: every Supabase var is swapped for its SUPABASE_TEST_* counterpart (SPEC §10).
 */
import "./lib/env";
import { execSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { requireEnv } from "./lib/env";

// One ID per run, so parallel runs (other PRs, a local run) get their own users and spots in the shared TEST
// project. CI: the Actions run + attempt; locally: random. tests/e2e/social.spec.ts derives emails from it.
const runId =
  process.env.E2E_RUN_ID ??
  (process.env.GITHUB_RUN_ID ? `gh${process.env.GITHUB_RUN_ID}-${process.env.GITHUB_RUN_ATTEMPT ?? "1"}` : `local${randomBytes(4).toString("hex")}`);

const env = {
  ...process.env,
  NEXT_PUBLIC_SUPABASE_URL: requireEnv("SUPABASE_TEST_URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: requireEnv("SUPABASE_TEST_ANON_KEY"),
  SUPABASE_SERVICE_ROLE_KEY: requireEnv("SUPABASE_TEST_SERVICE_ROLE_KEY"),
  E2E_RUN_ID: runId,
  ADMIN_EMAILS: `e2e-${runId}-admin@colo-nyc.test`,
  E2E_SOCIAL: "1",
  // Keep the Google map out of tests (its key is referrer-locked anyway).
  NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY: "",
  NEXT_PUBLIC_GOOGLE_MAP_ID: "",
};
if (env.NEXT_PUBLIC_SUPABASE_URL === process.env.NEXT_PUBLIC_SUPABASE_URL) throw new Error("Refusing to run: test URL equals the production URL");

const run = (cmd: string) => execSync(cmd, { stdio: "inherit", env });
run("tsx scripts/rls-check.ts");
run("pnpm exec next build");
// Serial, stateful suite: run once (desktop project).
run(`pnpm exec playwright test tests/e2e/social.spec.ts --project=desktop ${process.argv.slice(2).join(" ")}`);
