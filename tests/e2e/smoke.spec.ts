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

test("cards show at most 5 attribute chips and label unknown hours", async ({ page }) => {
  await page.goto("/en");
  const list = page.getByTestId("spot-list").filter({ visible: true });
  test.skip((await list.locator("li").count()) === 0, "no spot data yet");
  const counts = await list.getByTestId("card-chips").evaluateAll((els) => els.map((e) => e.children.length));
  expect(Math.max(...counts)).toBeLessThanOrEqual(5);
  await expect(list.getByText("Hours unverified").first()).toBeVisible();
});

test("小红书 share card is a 3:4 PNG in each locale", async ({ request }, info) => {
  test.skip(info.project.name === "mobile", "covered on desktop");
  for (const locale of ["en", "zh"]) {
    const res = await request.get(`/${locale}/spot/the-lost-draft-nolita/card`);
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("image/png");
    const buf = await res.body();
    expect([buf.readUInt32BE(16), buf.readUInt32BE(20)]).toEqual([1080, 1440]); // PNG IHDR width × height
  }
});
