import { expect, test } from "@playwright/test";

// Smoke tests (SPEC §10). Social flow tests land in M3 (tests/e2e/social.spec.ts).

for (const locale of ["en", "zh"] as const) {
  test(`home loads in ${locale}`, async ({ page }) => {
    await page.goto(`/${locale}`);
    await expect(page.locator("html")).toHaveAttribute("lang", locale === "zh" ? "zh-Hans" : "en");
    await expect(page.getByTestId("result-count").filter({ visible: true })).toBeVisible();
  });
}

test("root redirects to a locale", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/(en|zh)$/);
});

test("filters change the result count and live in the URL", async ({ page }, info) => {
  test.skip(info.project.name === "mobile", "covered on desktop");
  await page.goto("/en");
  const list = page.getByTestId("spot-list").filter({ visible: true });
  const total = await list.locator("li").count();
  test.skip(total === 0, "no spot data yet");
  await page.getByRole("button", { name: "Free (no purchase)" }).filter({ visible: true }).click();
  await expect(page).toHaveURL(/f=free/);
  await expect.poll(async () => list.locator("li").count()).toBeLessThan(total);
  await page.reload();
  await expect(page.getByRole("button", { name: "Free (no purchase)" }).filter({ visible: true })).toHaveAttribute("aria-pressed", "true");
});

test("spot page renders the score breakdown", async ({ page }) => {
  await page.goto("/en");
  const first = page.getByTestId("spot-list").filter({ visible: true }).locator("a").first();
  test.skip((await first.count()) === 0, "no spot data yet");
  await first.click();
  await expect(page.getByTestId("score-breakdown")).toBeVisible();
});

test("anonymous visitors see counts, never names", async ({ page }) => {
  await page.goto("/en");
  const first = page.getByTestId("spot-list").filter({ visible: true }).locator("a").first();
  test.skip((await first.count()) === 0, "no spot data yet");
  await first.click();
  const social = page.getByTestId("spot-social");
  await expect(social).toBeVisible();
  await expect(social.getByTestId("checkin-name")).toHaveCount(0);
});

test("unknown pages show the friendly 404", async ({ page }) => {
  const res = await page.goto("/zh/nope-not-here");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("走丢");
});
