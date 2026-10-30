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

test("suggest-a-spot entry points: header (desktop), sheet (mobile), empty results", async ({ page }, info) => {
  await page.goto("/en");
  if (info.project.name === "desktop") {
    await expect(page.getByTestId("header-suggest")).toBeVisible();
    await expect(page.getByTestId("header-suggest")).toHaveAttribute("href", "/en/submit");
    // Filters that match nothing show the "Don't see your spot?" prompt.
    await page.goto("/en?f=open,free,wifi,outlets,quiet,calls,group,weekend,nolimit&cat=museum");
    await expect(page.getByTestId("empty-suggest").filter({ visible: true })).toContainText("Don't see your spot?");
  } else {
    await expect(page.getByTestId("sheet-suggest")).toBeVisible();
    await expect(page.getByTestId("header-suggest")).toBeHidden();
  }
});

test("the suggestion form asks the 5 core details as optional taps", async ({ page }, info) => {
  test.skip(info.project.name === "mobile", "covered on desktop");
  await page.goto("/zh/submit");
  const quick = page.getByTestId("quick-taps");
  await expect(quick).toBeVisible();
  await expect(quick.getByText("Wi-Fi")).toBeVisible();
  await expect(quick).toContainText("先登录的话");
});

test("About is short and carries the data credits in both languages; the footer credits OSM", async ({ page }) => {
  for (const [locale, title, suggest] of [["en", "About", "Suggest a spot"], ["zh", "关于", "推荐地点"]] as const) {
    await page.goto(`/${locale}/about`);
    const about = page.getByTestId("about");
    await expect(about.getByRole("heading", { level: 1 })).toHaveText(title);
    await expect(about.locator("p")).toHaveCount(5);
    await expect(about.getByRole("link", { name: new RegExp(suggest) })).toHaveAttribute("href", `/${locale}/submit`);
    await expect(page.getByTestId("about-credits")).toContainText("OpenStreetMap");
    await expect(page.getByTestId("about-credits")).toContainText("Google");
    await expect(page.getByTestId("about-credits").getByRole("link", { name: /ODbL/ }).last()).toHaveAttribute("href", /LICENSE-DATA$/);
    await expect(about.getByRole("link", { name: "GitHub" })).toBeVisible();
    await expect(page.getByTestId("footer-osm").getByRole("link")).toHaveAttribute("href", "https://www.openstreetmap.org/copyright");
  }
  await page.goto("/en/spot/the-lost-draft-nolita");
  await expect(page.getByTestId("footer-osm")).toContainText("© OpenStreetMap contributors");
});

test("phone: with the list sheet open, the map and hero card underneath take no keyboard focus", async ({ page }, info) => {
  test.skip(info.project.name !== "mobile", "phone layout");
  // Hold the map unloaded so this tests the sheet being open, not the map failing.
  await page.addInitScript(() => {
    (window as Window & { requestIdleCallback?: unknown }).requestIdleCallback = () => 0;
    const add = window.addEventListener.bind(window);
    window.addEventListener = ((t: string, f: EventListenerOrEventListenerObject, o?: AddEventListenerOptions | boolean) => {
      if (!(typeof o === "object" && o.once && o.passive)) add(t, f, o);
    }) as typeof window.addEventListener;
  });
  await page.goto("/en");
  await page.waitForLoadState("networkidle");
  const toggle = page.getByRole("button", { name: "List", exact: true }).last(); // the floating pill (the handle shares its label)
  const box = (await toggle.boundingBox())!;
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await expect(page.locator("[data-sheet]")).toHaveAttribute("data-sheet", "full");
  const focused: string[] = [];
  for (let i = 0; i < 60; i++) {
    await page.keyboard.press("Tab");
    focused.push(await page.evaluate(() => (document.activeElement as HTMLElement).innerText?.trim() ?? ""));
  }
  expect(focused).not.toContain("Got it");
  expect(focused).not.toContain("Tap to load the map");
});
