import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Spot } from "../../src/lib/schema";

export const ROOT = join(import.meta.dirname, "..", "..");
export const SPOTS_PATH = join(ROOT, "src/data/spots.json");

export function readSpots(): Spot[] {
  return JSON.parse(readFileSync(SPOTS_PATH, "utf8"));
}

export function writeSpots(spots: Spot[]) {
  writeFileSync(SPOTS_PATH, JSON.stringify(spots, null, 2) + "\n");
}

export function today(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(new Date());
}
