// Allowed visitor-report values for the core details (mirrors the detail_votes CHECK constraint).
export const CROWD_VALUES = {
  wifi: ["strong", "ok", "weak", "none"],
  outlets: ["many", "some", "few", "none"],
  laptopPolicy: ["welcome", "weekdays_only", "restricted_areas", "discouraged"],
  noise: ["quiet", "moderate", "lively"],
} as const satisfies Record<string, readonly string[]>;

export type Core5Answer = Partial<Record<"wifi" | "outlets" | "laptopPolicy" | "noise" | "hours", string>>;
