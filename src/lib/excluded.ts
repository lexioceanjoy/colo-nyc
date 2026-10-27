import "server-only";
import { readFileSync } from "node:fs";
import { join } from "node:path";

export type ExcludedKind = "closed" | "laptops" | "paid" | "other";
export type Excluded = { name: string; reason: string; kind: ExcludedKind };

/** Minimal RFC 4180 parser (quoted fields, escaped quotes). */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') q = false;
      else field += c;
    } else if (c === '"') q = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      if (row.some((f) => f)) rows.push(row);
      row = [];
      field = "";
    } else field += c;
  }
  if (field || row.length) rows.push([...row, field]);
  return rows;
}

function kind(reason: string): ExcludedKind {
  const r = reason.toLowerCase();
  if (/paid|coworking|membership/.test(r)) return "paid";
  if (/closed|relocat|no longer listed|no weekday daytime/.test(r)) return "closed";
  if (/laptop/.test(r)) return "laptops";
  return "other";
}

/** The excluded-spots list from data/excluded.csv (About page content, SPEC §5.1/§6.7). */
export function getExcluded(): Excluded[] {
  const [, ...rows] = parseCsv(readFileSync(join(process.cwd(), "data/excluded.csv"), "utf8"));
  return rows.filter((r) => r[0]).map(([name, , reason]) => ({ name, reason, kind: kind(reason) }));
}
