import { test } from "@playwright/test";
import { KEY_PAGES, LOCALES, WIDTHS, assertAllControlsReachable, assertKeyboardFocusVisible, freezeMapLoad, viewportFor } from "./support/reach";

// Every control on every key page is reachable by a real user, at every width, in both languages,
// by pointer (on screen or in a scroll container the user can scroll, and not covered) and by keyboard.
// Widths come from viewportFor(), so this runs once, in the desktop project.

test.describe.configure({ mode: "parallel" });

for (const [pageName, path] of Object.entries(KEY_PAGES)) {
  for (const locale of LOCALES) {
    for (const width of WIDTHS) {
      test(`${pageName} · ${locale} · ${width}px: every control is reachable by pointer and keyboard`, async ({ browser }, info) => {
        test.skip(info.project.name !== "desktop", "widths are set per test");
        const ctx = await browser.newContext(viewportFor(width));
        const page = await ctx.newPage();
        await freezeMapLoad(page);
        await page.goto(`/${locale}${path}`);
        await page.waitForLoadState("networkidle");
        const where = `/${locale}${path} @ ${width}px`;
        await assertAllControlsReachable(page, where);
        await assertKeyboardFocusVisible(page, where);
        await ctx.close();
      });
    }
  }
}
