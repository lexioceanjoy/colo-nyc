/**
 * pnpm shots [slug] — screenshots of home + a spot page at 390px and 1440px in both locales (CLAUDE.md rule 8).
 * Expects `next start` (or dev) on BASE_URL (default http://localhost:3000; the browser Maps key allows only that origin locally).
 */
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const base = process.env.BASE_URL ?? "http://localhost:3000";
const slug = process.argv[2] ?? "the-lost-draft-nolita";
const out = ".shots";
mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const errors: string[] = [];
for (const [name, viewport] of [["mobile", { width: 390, height: 844 }], ["desktop", { width: 1440, height: 900 }]] as const) {
  for (const loc of ["en", "zh"]) {
    const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    page.on("console", (m) => m.type() === "error" && errors.push(`[${name}/${loc}] ${m.text().slice(0, 200)}`));
    await page.goto(`${base}/${loc}`);
    await page.mouse.move(10, 10);
    await page.waitForTimeout(4000); // map loads on idle
    await page.screenshot({ path: `${out}/home-${name}-${loc}.png` });
    await page.goto(`${base}/${loc}/spot/${slug}`);
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${out}/spot-${name}-${loc}.png`, fullPage: name === "desktop" });
    await ctx.close();
  }
}
await browser.close();
console.log(errors.length ? errors.join("\n") : "no console errors");
