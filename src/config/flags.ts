// Feature flags (docs/NEXT-PHASES.md rule 1). Each phase ships behind one flag, default on once verified.
// To hide a misbehaving feature in production, flip it to false and push: no revert needed.
export const flags = {} as const;

export type Flag = keyof typeof flags;
