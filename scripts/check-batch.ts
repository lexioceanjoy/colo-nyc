/** Validate one research batch file: `tsx scripts/check-batch.ts data/batches/batch-01.json` */
import { readFileSync } from "node:fs";
import { spotSchema } from "../src/lib/schema";
import { spotProblems } from "./lib/rules";

const file = process.argv[2];
if (!file) throw new Error("usage: check-batch <file>");
const raw = JSON.parse(readFileSync(file, "utf8"));
if (!Array.isArray(raw)) throw new Error("batch must be a JSON array");
let bad = 0;
const slugs = new Set<string>();
for (const [i, item] of raw.entries()) {
  const label = item?.slug ?? `#${i}`;
  const r = spotSchema.safeParse(item);
  if (!r.success) {
    bad++;
    for (const is of r.error.issues) console.error(`✗ ${label} ${is.path.join(".")}: ${is.message}`);
    continue;
  }
  if (slugs.has(r.data.slug)) {
    console.error(`✗ ${label}: duplicate slug`);
    bad++;
  }
  slugs.add(r.data.slug);
  const probs = spotProblems(r.data);
  if (probs.length) bad++;
  for (const p of probs) console.error(`✗ ${label}: ${p}`);
}
console.log(bad ? `${bad} spot(s) with problems out of ${raw.length}` : `✓ ${raw.length} spots OK`);
process.exit(bad ? 1 : 0);
