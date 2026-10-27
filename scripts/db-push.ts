/** pnpm db:push [--test] — apply supabase/migrations to the prod (default) or test project via the DB password in .env.local. */
import "./lib/env";
import { execFileSync } from "node:child_process";
import { requireEnv } from "./lib/env";

const test = process.argv.includes("--test");
const url = requireEnv(test ? "SUPABASE_TEST_URL" : "NEXT_PUBLIC_SUPABASE_URL");
const pw = encodeURIComponent(requireEnv(test ? "SUPABASE_TEST_DB_PASSWORD" : "SUPABASE_DB_PASSWORD"));
const ref = new URL(url).hostname.split(".")[0];

// Free-tier direct hosts are IPv6-only, so fall back to the IPv4 session poolers.
const candidates = [
  `postgresql://postgres:${pw}@db.${ref}.supabase.co:5432/postgres`,
  `postgresql://postgres.${ref}:${pw}@aws-1-us-east-1.pooler.supabase.com:5432/postgres`,
  `postgresql://postgres.${ref}:${pw}@aws-0-us-east-1.pooler.supabase.com:5432/postgres`,
];
for (const [i, dbUrl] of candidates.entries()) {
  try {
    execFileSync("pnpm", ["exec", "supabase", "db", "push", "--db-url", dbUrl, "--yes"], { stdio: ["ignore", "pipe", "pipe"] });
    console.log(`✓ migrations applied to ${test ? "TEST" : "PROD"} (route ${i + 1})`);
    process.exit(0);
  } catch (e) {
    const msg = String((e as { stderr?: Buffer }).stderr ?? e).replaceAll(pw, "***").split("\n").filter(Boolean).slice(-2).join(" | ");
    console.warn(`route ${i + 1} failed: ${msg}`);
  }
}
process.exit(1);
