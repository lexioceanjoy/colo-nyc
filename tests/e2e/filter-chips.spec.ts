import { expect, test, type Page } from "@playwright/test";
import en from "../../messages/en.json" with { type: "json" };
import zh from "../../messages/zh.json" with { type: "json" };

// Every filter chip must be visible, reachable by scrolling the row, or one tap away under "More filters".
// Regression: the desktop 400px list panel clipped the row after "Free (no purchase)" with no way to scroll.

const FLAGS = ["open", "free", "wifi", "outlets", "quiet", "group", "calls", "weekend", "nolimit"] as const;
const MESSAGES = { en, zh };

/** Keep the 400px list panel on screen: without a Maps key (CI) the map fails on load and the page switches
 *  to the full-width list. Maps loads on idle or the first pointerdown/keydown/wheel, so we stub idle and
 *  click with synthetic events only. */
async function openWithoutMap(page: Page, url: string) {
  await page.addInitScript(() => {
    (window as Window & { requestIdleCallback?: unknown }).requestIdleCallback = () => 0;
  });
  await page.goto(url);
}

async function expectAllReachable(page: Page, locale: "en" | "zh", desktop: boolean) {
  const m = MESSAGES[locale];
  const bar = page.getByRole("region", { name: m.filters.label }).filter({ visible: true });
  const row = bar.getByTestId("filter-chips");
  await expect(row).toBeVisible();
  if (desktop) await expect(page.getByText(m.map.unavailable)).toHaveCount(0);

  const box = await row.evaluate((el) => {
    const lines = new Set(
      Array.from(el.children as HTMLCollectionOf<HTMLElement>)
        .filter((c) => c.offsetHeight > 0)
        .map((c) => {
          const r = c.getBoundingClientRect();
          return Math.round(r.top + r.height / 2);
        }),
    );
    return { overflow: el.scrollWidth - el.clientWidth, lines: lines.size, overflowX: getComputedStyle(el).overflowX };
  });
  if (desktop) {
    expect(box.overflow, "desktop row must not clip sideways").toBeLessThanOrEqual(1);
    expect(box.lines, "desktop row wraps to at most 2 lines").toBeLessThanOrEqual(2);
  } else {
    expect(box.overflowX).toBe("auto");
    expect(box.lines, "mobile row stays one line").toBe(1);
  }

  const toggle = row.getByTestId("more-filters-toggle");
  await toggle.scrollIntoViewIfNeeded();
  await expect(toggle).toBeInViewport();
  await expect(toggle, "no number while nothing hidden is on").toHaveText(m.filters.more);
  await toggle.dispatchEvent("click");
  await expect(bar.locator("#more-filters")).toBeVisible();

  const labels = [...FLAGS.map((f) => m.filters[f]), ...Object.values(m.category)];
  for (const label of labels) {
    const chip = bar.getByRole("button", { name: label, exact: true });
    await expect(chip, `"${label}" is rendered exactly once`).toHaveCount(1);
    await chip.scrollIntoViewIfNeeded();
    await expect(chip, `"${label}" is reachable`).toBeInViewport();
  }
}

for (const locale of ["en", "zh"] as const) {
  test(`every filter chip is visible or reachable (${locale})`, async ({ page }, info) => {
    await openWithoutMap(page, `/${locale}`);
    await expectAllReachable(page, locale, info.project.name === "desktop");
  });

  test(`desktop at 1024px keeps every chip reachable (${locale})`, async ({ page }, info) => {
    test.skip(info.project.name === "mobile", "desktop breakpoint only");
    await page.setViewportSize({ width: 1024, height: 768 });
    await openWithoutMap(page, `/${locale}`);
    await expectAllReachable(page, locale, true);
  });
}

for (const locale of ["en", "zh"] as const) {
  test(`More filters counts only active filters it hides (${locale})`, async ({ page }) => {
    const m = MESSAGES[locale];
    // "open" is always in the row; "calls" and a type always sit behind More.
    await openWithoutMap(page, `/${locale}?f=open,calls&cat=cafe`);
    const toggle = page.getByTestId("more-filters-toggle").filter({ visible: true });
    await expect(toggle).toHaveText(`${m.filters.more} · 2`);
    await expect(toggle).toHaveCSS("font-weight", "600");
  });
}

test("mobile chip row scrolls sideways and fades its right edge until the end", async ({ page }, info) => {
  test.skip(info.project.name === "desktop", "mobile only");
  await openWithoutMap(page, "/en");
  const bar = page.getByRole("region", { name: en.filters.label }).filter({ visible: true });
  const row = bar.getByTestId("filter-chips");
  await expect(bar.getByTestId("chips-fade")).toBeVisible();
  await row.evaluate((el) => el.scrollTo({ left: el.scrollWidth }));
  await expect(bar.getByTestId("chips-fade")).toHaveCount(0);
  await expect(bar.getByTestId("more-filters-toggle")).toBeInViewport();
});
