import type { Confidence, Spot } from "./schema";

// Work Score (SPEC §4.3): 0–10, computed, never stored. Always shown with its breakdown.

export const SCORE_WEIGHTS = {
  wifi: 0.25,
  outlets: 0.2,
  seating: 0.15,
  noise: 0.15,
  laptopPolicy: 0.15,
  timeLimitMin: 0.1,
} as const;
export type ScoredAttr = keyof typeof SCORE_WEIGHTS;

const NEUTRAL = 0.5;

const MAPS: { [K in Exclude<ScoredAttr, "timeLimitMin">]: Record<string, number> } = {
  wifi: { strong: 1, ok: 0.65, weak: 0.3, none: 0 },
  outlets: { many: 1, some: 0.65, few: 0.3, none: 0 },
  seating: { plenty: 1, moderate: 0.6, limited: 0.25 },
  noise: { quiet: 1, moderate: 0.65, lively: 0.3 },
  laptopPolicy: { welcome: 1, restricted_areas: 0.65, weekdays_only: 0.5, discouraged: 0.1 },
};

export function timeLimitFactor(min: number | null): number {
  if (min === null) return 1;
  if (min >= 180) return 0.75;
  if (min >= 120) return 0.55;
  if (min >= 60) return 0.35;
  return 0.15;
}

export type ScoreLine = {
  key: ScoredAttr;
  weight: number;
  /** 0–1 normalized value; NEUTRAL when unknown */
  factor: number;
  /** contribution to the 0–10 score */
  points: number;
  max: number;
  unknown: boolean;
  confidence: Confidence;
};

export type WorkScore = { score: number; confidence: Confidence; unknownCount: number; lines: ScoreLine[] };

const CONF_NUM: Record<Confidence, number> = { high: 1, medium: 0.6, low: 0.2 };

export function computeScore(spot: Pick<Spot, "work">): WorkScore {
  const lines: ScoreLine[] = (Object.keys(SCORE_WEIGHTS) as ScoredAttr[]).map((key) => {
    const a = spot.work[key];
    const unknown = a.value === "unknown";
    let factor = NEUTRAL;
    if (!unknown) {
      factor = key === "timeLimitMin" ? timeLimitFactor(a.value as number | null) : (MAPS[key][String(a.value)] ?? NEUTRAL);
    }
    const weight = SCORE_WEIGHTS[key];
    return { key, weight, factor, points: round1(factor * weight * 10), max: weight * 10, unknown, confidence: a.confidence };
  });

  const score = round1(lines.reduce((s, l) => s + l.factor * l.weight * 10, 0));
  const unknownCount = lines.filter((l) => l.unknown).length;

  // Weighted mean confidence of known attributes, then capped by unknowns.
  const known = lines.filter((l) => !l.unknown);
  const knownWeight = known.reduce((s, l) => s + l.weight, 0);
  const mean = knownWeight ? known.reduce((s, l) => s + CONF_NUM[l.confidence] * l.weight, 0) / knownWeight : 0;
  let confidence: Confidence = mean >= 0.8 ? "high" : mean >= 0.5 ? "medium" : "low";
  if (unknownCount >= 2) confidence = "low";
  else if (unknownCount === 1 && confidence === "high") confidence = "medium";

  return { score, confidence, unknownCount, lines };
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}
