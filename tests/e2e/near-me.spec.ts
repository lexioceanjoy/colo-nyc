import { expect, test } from "@playwright/test";
import geo from "../../src/data/address-geo.json" with { type: "json" };
import { userClick } from "./support/reach";

// Phase 3 "Near me" with mocked geolocation. Desktop only (layout-independent logic; mobile covered by screenshots).
const lincoln = (geo as Record<string, { lat: number; lng: number }>)["lincoln-station-prospect-heights"];
const nextToLincoln = { latitude: lincoln.lat + 0.0002, longitude: lincoln.lng }; // ~22 m away

test.describe("Near me", () => {
  test.beforeEach(({}, info) => {
    test.skip(info.project.name !== "desktop", "desktop only");
  });

  test("never asks for location on page load, even with sort=distance in the URL", async ({ page }) => {
    await page.addInitScript(() => {
      (window as unknown as { __geoCalls: number }).__geoCalls = 0;
      const orig = navigator.geolocation.getCurrentPosition.bind(navigator.geolocation);
      navigator.geolocation.getCurrentPosition = (...a: Parameters<typeof orig>) => {
        (window as unknown as { __geoCalls: number }).__geoCalls++;
        return orig(...a);
      };
    });
    await page.goto("/en?sort=distance");
    await page.waitForTimeout(1500);
    expect(await page.evaluate(() => (window as unknown as { __geoCalls: number }).__geoCalls)).toBe(0);
  });

  test("allow: sorts by distance, shows walking time, nudges a check-in, no location in the URL", async ({ browser }) => {
    const ctx = await browser.newContext({ geolocation: nextToLincoln, permissions: ["geolocation"], viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto("/en");
    await userClick(page, page.getByTestId("near-me"));
    const list = page.getByTestId("spot-list").filter({ visible: true });
    const first = list.locator("li").first();
    await expect(first).toContainText("Lincoln Station");
    await expect(first.getByTestId("card-walk")).toContainText(/mi · \d+ min walk/);
    await expect(first.getByTestId("card-nudge")).toContainText("Working at Lincoln Station? Check in");
    await expect(page.getByTestId("near-chips").filter({ visible: true })).toBeVisible();
    // Walk chip narrows the list.
    const before = await list.locator("li").count();
    await userClick(page, page.getByTestId("near-chips").filter({ visible: true }).getByText("≤10 min walk"));
    await expect.poll(() => list.locator("li").count()).toBeLessThan(before);
    expect(page.url()).not.toMatch(/40\.\d|-73\.\d|lat|lng/);
    await ctx.close();
  });

  test("deny: friendly note and neighborhood picker, no repeat prompt", async ({ browser }) => {
    const ctx = await browser.newContext({ permissions: [], viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto("/zh");
    await userClick(page, page.getByTestId("near-me"));
    const note = page.getByTestId("near-fallback").filter({ visible: true });
    await expect(note).toContainText("不会再问你");
    await note.getByRole("combobox").selectOption("park_slope");
    await expect(page).toHaveURL(/hood=park_slope/);
    await ctx.close();
  });
});
