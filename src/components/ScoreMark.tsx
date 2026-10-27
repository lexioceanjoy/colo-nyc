import type { Confidence } from "@/lib/schema";

// The Work Score, circled in ballpoint like a note in a friend's notebook.
export function ScoreMark({
  score,
  confidence,
  size = "md",
  label,
}: {
  score: number;
  confidence: Confidence;
  size?: "md" | "lg";
  label: string;
}) {
  const lg = size === "lg";
  const dash = confidence === "low" ? "4 5" : confidence === "medium" ? "10 3" : undefined;
  return (
    <span
      className={`relative inline-grid shrink-0 place-items-center text-pen ${lg ? "size-20" : "size-12"}`}
      role="img"
      aria-label={label}
    >
      <svg viewBox="0 0 60 60" className="absolute inset-0 size-full" aria-hidden>
        <path
          d="M31 6c13 0 24 9 23 23-1 15-12 25-25 25C15 54 5 44 6 30 7 16 18 6 33 7c2 0 3 1 3 1"
          fill="none"
          stroke="currentColor"
          strokeWidth={lg ? 1.6 : 1.8}
          strokeLinecap="round"
          strokeDasharray={dash}
        />
      </svg>
      <span className={`font-serif tabular-nums leading-none ${lg ? "text-3xl" : "text-lg"}`}>{score.toFixed(1)}</span>
    </span>
  );
}
