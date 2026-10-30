// Feature flags (docs/NEXT-PHASES.md rule 1). Each phase ships behind one flag, default on once verified.
// To hide a misbehaving feature in production, flip it to false and push: no revert needed.
export const flags = {
  /** Phase 1: a single signed-in report fills an unknown core detail (1 → low, 2 → medium, 3+ → high). */
  crowdSingleReport: true,
  /** Phase 2: suggest-a-spot entry points, quick answers for the 5 core details, intake pipeline, credit. */
  suggestFlow: true,
} as const;

export type Flag = keyof typeof flags;
