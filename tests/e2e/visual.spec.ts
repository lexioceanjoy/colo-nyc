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
        // Fonts use display: optional (layout.tsx): if a face misses its ~100ms window the page keeps the fallback,
        // even from cache, so screenshots flip between faces. In this test only, re-declare the same faces with
        // display: block in an extra <style> (the last matching face wins). Don't rewrite the HTML: the CSS is
        // inlined in a React-managed <style> (experimental.inlineCss) and editing it breaks hydration.
        await page.addInitScript(() => {
          document.addEventListener("DOMContentLoaded", () => {
            const css = [...document.querySelectorAll("style")].map((s) => s.textContent ?? "").join("\n");
            const faces = css.match(/@font-face\{[^}]*\}/g) ?? [];
            const style = document.createElement("style");
            style.textContent = faces.map((f) => f.replace(/font-display:\s*optional/, "font-display:block")).join("\n");
            document.head.append(style);
          });
        });
        // Clock first: installing it replaces requestIdleCallback, which freezeMapLoad then stubs again.
        await page.clock.setFixedTime(FROZEN_NOW);
        await freezeMapLoad(page);
        await page.goto(`/${locale}${path}`, { waitUntil: "load" }); // networkidle can hang under the fixed clock
        // Load every declared family for the text actually on the page (fonts.ready alone can resolve first).
        await page.evaluate(async () => {
          const families = new Set([...document.fonts].map((f) => f.family.replace(/"/g, "")).filter((f) => !f.endsWith("Fallback")));
          const text = document.body.innerText;
          await Promise.all([...families].map((f) => document.fonts.load(`16px "${f}"`, text)));
          await document.fonts.ready;
        });
        // Hydrated: React has attached to the footer (rendered last on every page), so client-only UI (Open now,
        // the map placeholder, the chip-row collapse) is in. A fixed sleep wasn't enough on slow CI runners.
        await page.waitForFunction(() => {
          const el = document.querySelector("footer") ?? document.querySelector("header");
          return Boolean(el && Object.keys(el).some((k) => k.startsWith("__reactFiber")));
        }, undefined, { polling: 100 });
        await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
        await page.waitForTimeout(300); // ResizeObserver-driven layout (chip-row collapse) settles
        // Home is judged by what's on screen (map + sheet or panel); other pages in full.
        await expect(page).toHaveScreenshot(`${name}-${locale}-${width}.png`, { fullPage: name !== "home" });
        await ctx.close();
      });
    }
  }
}
