import { expect, test } from "@playwright/test";
import { userClick } from "./support/reach";

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

test("filters change the result count and live in the URL", async ({ page }, info) => {
  test.skip(info.project.name === "mobile", "covered on desktop");
  await page.goto("/en");
  const list = page.getByTestId("spot-list").filter({ visible: true });
  const total = await list.locator("li").count();
  test.skip(total === 0, "no spot data yet");
  await userClick(page, page.getByRole("button", { name: "Free (no purchase)" }));
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

test("signed-out admin page shows the admins-only notice in both languages", async ({ page }) => {
  for (const [locale, notice] of [["en", "This page is for admins."], ["zh", "这个页面仅限管理员。"]] as const) {
    const res = await page.goto(`/${locale}/admin`);
    expect(res?.status()).toBe(200);
    await expect(page.getByText(notice)).toBeVisible();
  }
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

test("a keyboard user can see which quick-tap pill has focus", async ({ page }, info) => {
  test.skip(info.project.name === "mobile", "covered on desktop");
  await page.goto("/en/submit");
  const radio = page.getByTestId("quick-taps").locator('input[type="radio"]').first();
  await radio.focus();
  await page.keyboard.press("ArrowRight"); // keyboard interaction, so :focus-visible applies
  const pill = page.getByTestId("quick-taps").locator("label:has(input:focus-visible)");
  await expect(pill).toHaveCount(1);
  await expect(pill).toHaveCSS("outline-style", "solid");
  await expect(pill).toHaveCSS("outline-width", "2px");
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

test("phone: swiping the list in the peek sheet opens it and reaches the last spot", async ({ page }, info) => {
  test.skip(info.project.name !== "mobile", "phone layout");
  // Hold the map unloaded (it loads on idle or the first wheel; without a key it fails and locks the sheet open).
  await page.addInitScript(() => {
    (window as Window & { requestIdleCallback?: unknown }).requestIdleCallback = () => 0;
    const add = window.addEventListener.bind(window);
    window.addEventListener = ((t: string, f: EventListenerOrEventListenerObject, o?: AddEventListenerOptions | boolean) => {
      if (!(typeof o === "object" && o.once && o.passive)) add(t, f, o);
    }) as typeof window.addEventListener;
  });
  await page.goto("/en");
  await page.waitForLoadState("networkidle"); // hydrated, so the sheet listens for scroll
  const sheet = page.locator("[data-sheet]");
  await expect(sheet).toHaveAttribute("data-sheet", "peek");
  const box = (await page.getByTestId("sheet-content").boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + 120); // over the cards, clear of the floating List button
  await page.mouse.wheel(0, 300);
  await expect(sheet).toHaveAttribute("data-sheet", "full");
  const last = page.getByTestId("spot-list").filter({ visible: true }).locator("li").last();
  for (let i = 0; i < 80; i++) {
    const b = await last.boundingBox();
    if (b && b.y + b.height <= 844) break;
    await page.mouse.wheel(0, 800);
  }
  await expect(last).toBeInViewport();

  // At the very end, the floating List/Map pill must not sit on the last links.
  await page.getByTestId("sheet-content").evaluate((e) => e.scrollTo(0, e.scrollHeight));
  const links = page.getByTestId("sheet-content").locator("footer a");
  await expect(links.last()).toBeInViewport();
  const covered = await links.evaluateAll((els) =>
    els
      .filter((a) => {
        const r = a.getClientRects()[0];
        const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        return !(hit && (hit === a || a.contains(hit)));
      })
      .map((a) => a.textContent),
  );
  expect(covered, "footer links covered by the floating pill").toEqual([]);
});

for (const width of [390, 768]) {
  test(`${width}px: keyboard focus in the list sheet never hides under the floating pill`, async ({ page }, info) => {
    test.skip(info.project.name !== "mobile", "phone/tablet layout");
    await page.setViewportSize({ width, height: width < 768 ? 844 : 1024 });
    await page.addInitScript(() => {
      (window as Window & { requestIdleCallback?: unknown }).requestIdleCallback = () => 0;
      const add = window.addEventListener.bind(window);
      window.addEventListener = ((t: string, f: EventListenerOrEventListenerObject, o?: AddEventListenerOptions | boolean) => {
        if (!(typeof o === "object" && o.once && o.passive)) add(t, f, o);
      }) as typeof window.addEventListener;
    });
    await page.goto("/en");
    await page.waitForLoadState("networkidle");
    await page.getByTestId("sheet-content").locator("a, button").first().focus();
    const covered: string[] = [];
    for (let i = 0; i < 40; i++) {
      await page.keyboard.press("Tab");
      const hit = await page.evaluate(async () => {
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))); // let focus scrolling settle
        const el = document.activeElement as HTMLElement;
        // The sideways chip row has its own keyboard test; this one is about the pill.
        if (!el.closest("[data-testid=sheet-content]") || el.closest("[data-testid=filter-chips]")) return null;
        const r = el.getBoundingClientRect();
        const p = document.querySelector("[data-testid=sheet-toggle]")!.getBoundingClientRect();
        const overlaps = r.bottom > p.top && r.top < p.bottom && r.right > p.left && r.left < p.right;
        return overlaps ? el.innerText.replace(/\s+/g, " ").slice(0, 30) : null;
      });
      if (hit) covered.push(hit);
    }
    expect(covered, "focused items overlapping the floating List/Map pill").toEqual([]);

    // Scrolled to the very end, the last links clear the pill too.
    const endCovered = await page.getByTestId("sheet-content").evaluate((sc) => {
      sc.scrollTo(0, sc.scrollHeight);
      const p = document.querySelector("[data-testid=sheet-toggle]")!.getBoundingClientRect();
      return [...sc.querySelectorAll<HTMLElement>("footer a")]
        .filter((a) => {
          const r = a.getClientRects()[0];
          return r.bottom > p.top && r.top < p.bottom && r.right > p.left && r.left < p.right;
        })
        .map((a) => a.innerText);
    });
    expect(endCovered, "links at the end of the list under the pill").toEqual([]);
  });
}
