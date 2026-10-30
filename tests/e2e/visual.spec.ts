import { expect, test } from "@playwright/test";
import { KEY_PAGES, LOCALES, WIDTHS, freezeMapLoad, viewportFor } from "./support/reach";

// Visual regression: every key page at every width, both languages. Any pixel change must be approved on purpose
// by committing new baselines (see CLAUDE.md "Visual baselines"). Baselines are rendered on Linux in CI, so this
// only runs in CI or with VISUAL=1 (macOS renders fonts differently and would never match).

test.skip(!process.env.CI && !process.env.VISUAL, "visual baselines are Linux/CI-only; set VISUAL=1 to run");

/** "Open now" and today's counts are computed in the browser, so a fixed clock makes them stable. */
const FROZEN_NOW = new Date("2026-10-28T19:00:00Z"); // a Wednesday, 3pm in New York

for (const [name, path] of Object.entries(KEY_PAGES)) {
  for (const locale of LOCALES) {
    for (const width of WIDTHS) {
      test(`${name} · ${locale} · ${width}px looks as approved`, async ({ browser }, info) => {
        test.skip(info.project.name !== "desktop", "widths are set per test");
        const ctx = await browser.newContext({ ...viewportFor(width), reducedMotion: "reduce" });
        const page = await ctx.newPage();
        // Clock first: installing it replaces requestIdleCallback, which freezeMapLoad then stubs again.
        await page.clock.setFixedTime(FROZEN_NOW);
        await freezeMapLoad(page);
        await page.goto(`/${locale}${path}`);
        await page.waitForLoadState("networkidle");
        await page.evaluate(() => document.fonts.ready);
        // Home is judged by what's on screen (map + sheet or panel); other pages in full.
        await expect(page).toHaveScreenshot(`${name}-${locale}-${width}.png`, { fullPage: name !== "home" });
        await ctx.close();
      });
    }
  }
}
