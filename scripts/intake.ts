/**
 * pnpm data:intake [--finalize] — turn accepted spot suggestions into researched spots (Phase 2).
 *
 * No AI or LLM API is called here (docs/NEXT-PHASES.md rule 6). Lexi runs this from a Claude Code session:
 *   1. `pnpm data:intake`            → writes data/intake/input.json + PROMPT.md (duplicates of mapped spots are skipped)
 *   2. Claude Code research agents   → write data/intake/research.json (Spot records, same rubric as M1, no guessing)
 *   3. `pnpm data:intake --finalize` → validates, resolves place IDs (≤180/day, duplicate IDs skipped), adds the spots,
 *      turns signed-in submitters' answers into their visitor reports, marks the suggestions as added, and opens ONE PR.
 * A new spot shows on the map only once it has 3 of the 5 core details (research + submitter answers + OSM).
 */
import "./lib/env";
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { requireEnv } from "./lib/env";
import { readSpots, writeSpots, ROOT, today } from "./lib/spots-io";
import { spotSchema, type Spot } from "../src/lib/schema";
import { spotProblems } from "./lib/rules";
import { isDuplicate, cleanAnswers } from "../src/lib/suggest";
import { textSearch, printEstimate, DAILY_SAFE } from "./lib/places";
import { nameSimilarity } from "./resolve-places";
import { NEIGHBORHOODS } from "../src/data/neighborhoods";

const DIR = join(ROOT, "data/intake");
/** --dry-run: no writes to spots.json, the database, git or GitHub; prints what would happen. */
const DRY = process.argv.includes("--dry-run");
const db = createClient(requireEnv("NEXT_PUBLIC_SUPABASE_URL"), requireEnv("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false } });

export type IntakeItem = {
  submission_id: string;
  name: string;
  neighborhood: string | null;
  address_or_link: string;
  category: string;
  why: string | null;
  answers: Record<string, string>;
  submitter: { user_id: string; first_name: string | null; credit: boolean } | null;
};

async function accepted(): Promise<IntakeItem[]> {
  const { data, error } = await db
    .from("spot_submissions")
    .select("id,name,address_or_link,category,why,user_id,submission_extras(neighborhood,answers,credit,intake_slug)")
    .eq("status", "accepted")
    .order("created_at");
  if (error) throw new Error(error.message);
  const items: IntakeItem[] = [];
  for (const r of data ?? []) {
    const rel = (r as unknown as { submission_extras: unknown }).submission_extras;
    const x = (Array.isArray(rel) ? rel[0] : rel) as { neighborhood: string | null; answers: Record<string, string>; credit: boolean; intake_slug: string | null } | null;
    if (x?.intake_slug) continue; // already added
    let submitter: IntakeItem["submitter"] = null;
    if (r.user_id) {
      const { data: p } = await db.from("profiles").select("display_name").eq("id", r.user_id).maybeSingle();
      submitter = { user_id: r.user_id as string, first_name: (p?.display_name as string | undefined)?.split(" ")[0] ?? null, credit: Boolean(x?.credit) };
    }
    items.push({
      submission_id: r.id as string,
      name: r.name as string,
      neighborhood: x?.neighborhood ?? null,
      address_or_link: r.address_or_link as string,
      category: r.category as string,
      why: (r.why as string | null) ?? null,
      answers: cleanAnswers(x?.answers ?? {}) as Record<string, string>,
      submitter,
    });
  }
  return items;
}

async function prepare() {
  const spots = readSpots();
  const items = await accepted();
  const fresh: IntakeItem[] = [];
  let skipped = 0;
  for (const i of items) {
    const existing = spots.find((s) => !s.closed && isDuplicate(i, s));
    if (!existing) {
      fresh.push(i);
      continue;
    }
    // Already on the map: mark it handled (pointing at the existing spot) so the weekly issue stops counting it.
    skipped++;
    if (!DRY) await db.from("submission_extras").upsert({ submission_id: i.submission_id, intake_slug: existing.slug, intake_at: new Date().toISOString() });
  }
  mkdirSync(DIR, { recursive: true });
  writeFileSync(join(DIR, "input.json"), JSON.stringify(fresh, null, 2) + "\n");
  writeFileSync(
    join(DIR, "PROMPT.md"),
    `# Intake research (${today()})

Research each suggestion in \`data/intake/input.json\` exactly like M1: read \`data/batches/PROMPT_RESEARCH.md\` and follow it
(same Spot shape, rubric, sources, bilingual copy, never guess, Google Maps is never a source).

- Use the submitter's \`address_or_link\` and \`neighborhood\` as starting points only; verify everything.
- The submitter's \`answers\` are NOT sources: don't copy them into the record (they become visitor reports separately).
- If a place is closed, a paid coworking space, or bans laptops, leave it out and note why.
- Add \`"submission_id"\` to each record (top level) so it can be matched back. It is removed before saving.

Write \`data/intake/research.json\` (array) and run:
\`pnpm exec tsx scripts/check-batch.ts data/intake/research.json\`
`,
  );
  console.log(`intake: ${fresh.length} suggestion(s) to research (${skipped} already on the map, skipped) → data/intake/input.json`);
  if (fresh.length) console.log("Next: run research agents with data/intake/PROMPT.md, then `pnpm data:intake --finalize`.");
}

async function finalize() {
  const file = join(DIR, "research.json");
  if (!existsSync(file)) throw new Error("data/intake/research.json not found: run the research step first");
  const input: IntakeItem[] = JSON.parse(readFileSync(join(DIR, "input.json"), "utf8"));
  const raw = JSON.parse(readFileSync(file, "utf8")) as (Record<string, unknown> & { submission_id?: string })[];
  const spots = readSpots();
  const existingIds = new Set(spots.map((s) => s.googlePlaceId).filter(Boolean));
  printEstimate("textSearchPro", Math.min(raw.length, DAILY_SAFE.searchText));

  const added: { item: IntakeItem; spot: Spot }[] = [];
  const log: string[] = [];
  for (const rec of raw.slice(0, DAILY_SAFE.searchText)) {
    const { submission_id, ...rest } = rec;
    const item = input.find((i) => i.submission_id === submission_id);
    const parsed = spotSchema.safeParse({ ...rest, googlePlaceId: null });
    if (!item || !parsed.success) {
      log.push(`✗ ${String(rest.slug)}: ${!item ? "no matching submission_id" : parsed.error!.issues.map((i) => i.path.join(".") + " " + i.message).join("; ")}`);
      continue;
    }
    const spot = parsed.data;
    const probs = spotProblems(spot);
    if (probs.length) {
      log.push(`✗ ${spot.slug}: ${probs.join("; ")}`);
      continue;
    }
    if (spots.some((s) => s.slug === spot.slug) || spots.some((s) => !s.closed && isDuplicate(spot, s))) {
      log.push(`· ${spot.slug}: already on the map, skipped`);
      continue;
    }
    // Resolve the place ID (Text Search, ids only kept) and skip if another spot already has it.
    const hits = await textSearch(`${spot.name} ${NEIGHBORHOODS[spot.neighborhood].en} New York`);
    const best = hits.map((h) => ({ h, sim: nameSimilarity(spot.name, h.displayName?.text ?? "") })).sort((a, b) => b.sim - a.sim)[0];
    if (best && best.sim >= 0.75) {
      if (existingIds.has(best.h.id)) {
        log.push(`· ${spot.slug}: same Google place as an existing spot, skipped`);
        continue;
      }
      spot.googlePlaceId = best.h.id;
      existingIds.add(best.h.id);
    }
    if (item.submitter?.credit && item.submitter.first_name) spot.suggestedBy = item.submitter.first_name;
    spot.addedAt = spot.updatedAt = today();
    added.push({ item, spot });
    log.push(`+ ${spot.slug}${spot.googlePlaceId ? "" : " (no place ID: add fallbackLocation or resolve later)"}`);
  }
  if (!added.length || DRY) {
    console.log(log.join("\n") || "nothing to add");
    if (DRY) for (const { item, spot } of added) console.log(`  would add ${spot.slug}${spot.suggestedBy ? ` (Suggested by ${spot.suggestedBy})` : ""}; would record ${Object.keys(item.answers).length} visitor report(s)`);
    return;
  }

  writeSpots([...spots, ...added.map((a) => a.spot)].sort((a, b) => a.slug.localeCompare(b.slug)));
  // Our own geocodes (NYC GeoSearch) + OSM tags for the new spots; neither calls Google or any AI.
  execSync("pnpm -s data:geocode && pnpm -s data:osm", { stdio: "inherit" });
  // Spots without a Google place ID use our own open-data geocode as their map position (SPEC §4.1 fallbackLocation).
  const geo = JSON.parse(readFileSync(join(ROOT, "src/data/address-geo.json"), "utf8")) as Record<string, { lat: number; lng: number }>;
  const after = readSpots();
  for (const { spot } of added) {
    const s = after.find((x) => x.slug === spot.slug);
    if (s && !s.googlePlaceId && !s.fallbackLocation && geo[s.slug]) s.fallbackLocation = { lat: geo[s.slug].lat, lng: geo[s.slug].lng, source: "https://geosearch.planninglabs.nyc/" };
  }
  writeSpots(after);
  execSync("pnpm -s validate", { stdio: "inherit" });

  for (const { item, spot } of added) {
    // Signed-in submitters' answers become their visitor reports (Phase 1 rules apply on the site).
    if (item.submitter) {
      const rows = Object.entries(item.answers).map(([field, value]) => ({ user_id: item.submitter!.user_id, spot_slug: spot.slug, field, value }));
      if (rows.length) await db.from("detail_votes").upsert(rows, { onConflict: "user_id,spot_slug,field" });
    }
    await db.from("submission_extras").upsert({ submission_id: item.submission_id, intake_slug: spot.slug, intake_at: new Date().toISOString() });
  }

  const branch = `intake-${today()}`;
  execSync(`git checkout -b ${branch} && git add src/data/spots.json src/data/address-geo.json data/osm-import.md && git commit -m "Intake: ${added.length} suggested spot(s)"`, { stdio: "inherit" });
  execSync(`git push -u origin ${branch}`, { stdio: "inherit" });
  const body = [`${added.length} suggested spot(s), researched in a Claude Code session (no AI APIs).`, "", ...log, "", "🤖 Generated with [Claude Code](https://claude.com/claude-code)"].join("\n");
  writeFileSync(join(DIR, "pr-body.md"), body);
  execSync(`gh pr create --base main --head ${branch} --title "Intake: ${added.length} suggested spot(s)" --body-file data/intake/pr-body.md`, { stdio: "inherit" });
  console.log(log.join("\n"));
}

if (process.argv.includes("--finalize")) await finalize();
else await prepare();
