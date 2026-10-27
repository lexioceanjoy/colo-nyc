import type { Category } from "@/lib/schema";

export const CATEGORY_COLOR: Record<Category, string> = {
  cafe: "var(--cat-cafe)",
  library: "var(--cat-library)",
  pops: "var(--cat-pops)",
  hotel_lobby: "var(--cat-hotel)",
  museum: "var(--cat-museum)",
  other_public: "var(--cat-other)",
};

export function CategoryDot({ category }: { category: Category }) {
  return <span aria-hidden className="inline-block size-2.5 rounded-full" style={{ background: CATEGORY_COLOR[category] }} />;
}
