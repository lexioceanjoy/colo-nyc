import { expect, test } from "@playwright/test";

// Google's OAuth consent screen links to /en/privacy, so CI fails if either privacy URL breaks.
for (const [locale, heading] of [["en", "Privacy"], ["zh", "隐私说明"]] as const) {
  test(`/${locale}/privacy returns 200 with content`, async ({ page }) => {
    const res = await page.goto(`/${locale}/privacy`);
    expect(res?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(heading);
    await expect(page.locator('a[href^="mailto:"]').first()).toBeVisible();
  });
}

test("footer links to the privacy page", async ({ page }) => {
  await page.goto("/en/about");
  const link = page.locator("footer").getByRole("link", { name: "Privacy" });
  await expect(link).toHaveAttribute("href", "/en/privacy");
  await link.click();
  await expect(page).toHaveURL(/\/en\/privacy$/);
});

test("the sign-in screen links to the privacy page", async ({ page }) => {
  for (const locale of ["en", "zh"] as const) {
    await page.goto(`/${locale}/signin`);
    const link = page.getByTestId("signin-privacy");
    await expect(link).toHaveAttribute("href", `/${locale}/privacy`);
  }
  await page.getByTestId("signin-privacy").click();
  await expect(page).toHaveURL(/\/zh\/privacy$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("隐私说明");
});
