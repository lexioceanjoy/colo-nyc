import { expect, type Locator, type Page } from "@playwright/test";

// Tests that check what a user can see and reach, not what the code does.
// Regression that motivated this: the filter chip row was clipped in the desktop list panel with a hidden
// scrollbar, and every existing test still passed because Playwright scrolls and clicks for you.

export const WIDTHS = [390, 768, 1024, 1280, 1440] as const;
export const LOCALES = ["en", "zh"] as const;
/** Key pages. Admin is checked signed out here; signed in, social.spec.ts drives it with userClick. */
export const KEY_PAGES = {
  home: "",
  spot: "/spot/the-lost-draft-nolita",
  sessions: "/sessions",
  submit: "/submit",
  about: "/about",
  admin: "/admin",
} as const;

/** Phones and tablets are touch; laptops and desktops use a mouse and can't swipe a hidden-scrollbar row sideways. */
export const viewportFor = (width: number) => ({
  viewport: { width, height: width < 1024 ? (width < 768 ? 844 : 1024) : 900 },
  hasTouch: width < 1024,
  isMobile: width < 768,
});

/**
 * Keep the page in its "map not loaded yet" state. Maps loads on idle or the first pointerdown/keydown/wheel;
 * without a key (CI) it then fails and the desktop page switches to the full-width list, which would move
 * controls mid-check. Production users see the 400px panel, so that's what we hold still and check.
 */
export async function freezeMapLoad(page: Page) {
  await page.addInitScript(() => {
    (window as Window & { requestIdleCallback?: unknown }).requestIdleCallback = () => 0;
    const add = window.addEventListener.bind(window);
    window.addEventListener = ((type: string, fn: EventListenerOrEventListenerObject, opts?: AddEventListenerOptions | boolean) => {
      const loadTrigger = typeof opts === "object" && opts.once && opts.passive && ["pointerdown", "keydown", "wheel"].includes(type);
      if (!loadTrigger) add(type, fn, opts);
    }) as typeof window.addEventListener;
  });
}

type Problem = { control: string; problem: string };

/**
 * Every button, link, chip and input on the page must be:
 *  1. in the viewport, or reachable by scrolling a container the user can actually scroll
 *     (vertical: always; sideways: only with touch or a visible scrollbar; the page itself must not scroll sideways);
 *  2. the element hit at its own center (nothing covers or clips it);
 *  3. not cut off by an ancestor with overflow hidden/clip.
 * Visually-hidden controls (sr-only, ≤1px) are skipped here and covered by the keyboard pass.
 */
export async function assertAllControlsReachable(page: Page, where = page.url()) {
  const problems: Problem[] = await page.evaluate(() => {
    const SELECTOR =
      'a[href], button, input:not([type="hidden"]), select, textarea, summary, [role="button"], [role="link"], [role="checkbox"], [role="tab"], [role="switch"], [tabindex]:not([tabindex="-1"])';
    const touch = navigator.maxTouchPoints > 0;
    const vw = document.documentElement.clientWidth;
    const out: { control: string; problem: string }[] = [];
    const name = (el: Element) => {
      const text = (el.getAttribute("aria-label") || (el as HTMLElement).innerText || el.getAttribute("name") || el.getAttribute("placeholder") || "").trim().replace(/\s+/g, " ").slice(0, 40);
      const id = el.getAttribute("data-testid");
      return `<${el.tagName.toLowerCase()}${id ? ` data-testid=${id}` : ""}> "${text}"`;
    };

    if (document.documentElement.scrollWidth > vw + 1) {
      const wide = [...document.body.querySelectorAll<HTMLElement>("*")].find((e) => e.getBoundingClientRect().right > vw + 1);
      out.push({ control: wide ? name(wide) : "<page>", problem: `page scrolls sideways (${document.documentElement.scrollWidth}px > ${vw}px)` });
    }

    const rendered = (el: HTMLElement) => {
      if (el.closest("[inert], [aria-hidden='true']")) return false;
      const s = getComputedStyle(el);
      if (s.visibility === "hidden" || s.display === "none") return false;
      if (s.clip === "rect(0px, 0px, 0px, 0px)" || s.clipPath === "inset(50%)") return false; // sr-only, even with padding
      const r = el.getBoundingClientRect();
      return r.width > 1 && r.height > 1; // display:none (incl. other breakpoints) is out
    };
    /** The box a user aims at: an inline link that wraps is its first line, not the union of its lines. */
    const target = (el: HTMLElement) => {
      const rects = el.getClientRects();
      return getComputedStyle(el).display === "inline" && rects.length > 1 ? rects[0] : el.getBoundingClientRect();
    };
    /** Containers between el and the viewport that could hide it. */
    const clippers = (el: HTMLElement) => {
      const list: { node: HTMLElement; x: string; y: string }[] = [];
      for (let p = el.parentElement; p && p !== document.body && p !== document.documentElement; p = p.parentElement) {
        const s = getComputedStyle(p);
        if (s.overflowX !== "visible" || s.overflowY !== "visible") list.push({ node: p, x: s.overflowX, y: s.overflowY });
        if (s.position === "fixed") break;
      }
      return list;
    };
    const userScrollable = (c: { node: HTMLElement; x: string; y: string }, axis: "x" | "y") => {
      const o = axis === "x" ? c.x : c.y;
      if (o !== "auto" && o !== "scroll") return false;
      if (axis === "y" || touch) return true;
      return c.node.offsetHeight - c.node.clientHeight - parseFloat(getComputedStyle(c.node).borderTopWidth) - parseFloat(getComputedStyle(c.node).borderBottomWidth) > 0;
    };

    for (const el of document.querySelectorAll<HTMLElement>(SELECTOR)) {
      if (!rendered(el)) continue;
      const cs = clippers(el);
      const before = cs.map((c) => [c.node.scrollLeft, c.node.scrollTop]);
      const pageX = window.scrollX;
      el.scrollIntoView({ block: "center", inline: "nearest" });
      let reason = "";
      cs.forEach((c, i) => {
        if (reason) return;
        const dx = c.node.scrollLeft !== before[i][0];
        const dy = c.node.scrollTop !== before[i][1];
        if ((dx && !userScrollable(c, "x")) || (dy && !userScrollable(c, "y")))
          reason = `only reachable by scrolling ${name(c.node)} (overflow ${dx ? c.x : c.y}${!touch && dx ? ", no visible scrollbar" : ""})`;
      });
      if (!reason && window.scrollX !== pageX) reason = "only reachable by scrolling the page sideways";
      const r = target(el);
      const vh = window.innerHeight;
      if (!reason) {
        // Walk outward. A container the user can scroll only cuts a control off if the control can't fit in it;
        // past it, what outer containers must not clip is that container's box (the user can bring the control there).
        const e = { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
        for (const c of cs) {
          if (c.x === "visible" && c.y === "visible") continue;
          const b = c.node.getBoundingClientRect();
          const sx = userScrollable(c, "x");
          const sy = userScrollable(c, "y");
          const clipX = sx ? r.width > c.node.clientWidth + 1 : c.x !== "visible" && (e.left < b.left - 1 || e.right > b.right + 1);
          const clipY = sy ? false : c.y !== "visible" && (e.top < b.top - 1 || e.bottom > b.bottom + 1) && e.bottom - e.top <= b.height;
          if (sx) [e.left, e.right] = [b.left, b.left + Math.min(r.width, b.width)];
          if (clipX || clipY) {
            reason = `cut off by ${name(c.node)} (overflow ${clipX ? c.x : c.y})`;
            break;
          }
        }
      }
      if (!reason && (r.left < -1 || r.right > vw + 1 || r.bottom < 0 || r.top > vh || (r.height <= vh && (r.top < -1 || r.bottom > vh + 1))))
        reason = `outside the viewport after scrolling (${Math.round(r.left)},${Math.round(r.top)} ${Math.round(r.width)}×${Math.round(r.height)})`;
      if (!reason) {
        const cx = Math.min(Math.max(r.left + r.width / 2, 0), vw - 1);
        const cy = Math.min(Math.max(r.top + r.height / 2, 0), vh - 1);
        const hit = document.elementFromPoint(cx, cy);
        const ok = hit && (hit === el || el.contains(hit) || (hit instanceof HTMLLabelElement && hit.control === el));
        if (!ok) reason = `covered at its center by ${hit ? name(hit) : "nothing (off-screen)"}`;
      }
      if (reason) out.push({ control: name(el), problem: reason });
    }
    window.scrollTo(0, 0);
    return out;
  });
  expect(problems, `unreachable controls on ${where}:\n${problems.map((p) => `  ${p.control}: ${p.problem}`).join("\n")}`).toEqual([]);
}

/** Tab through the page; every focused element must be on screen, visible, and not covered. */
export async function assertKeyboardFocusVisible(page: Page, where = page.url(), maxTabs = 250) {
  const problems: Problem[] = [];
  const seen = new Set<string>();
  await page.locator("body").evaluate((b) => (b as HTMLElement).focus());
  for (let i = 0; i < maxTabs; i++) {
    await page.keyboard.press("Tab");
    const f = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el || el === document.body) return null;
      const path = (e: Element): string => (e.parentElement ? `${path(e.parentElement)}>${[...e.parentElement.children].indexOf(e)}` : "");
      const text = (el.getAttribute("aria-label") || el.innerText || el.getAttribute("name") || "").trim().replace(/\s+/g, " ").slice(0, 40);
      const label = `<${el.tagName.toLowerCase()}${el.dataset.testid ? ` data-testid=${el.dataset.testid}` : ""}> "${text}"`;
      if (el.tagName === "IFRAME") return { key: path(el), label, problem: "" };
      const vw = document.documentElement.clientWidth;
      const vh = window.innerHeight;
      const invisible = (e: HTMLElement) => {
        const st = getComputedStyle(e);
        const b = e.getBoundingClientRect();
        return b.width <= 1 || b.height <= 1 || st.visibility === "hidden" || Number(st.opacity) === 0;
      };
      // A visually-hidden radio/checkbox is fine if its visible label shows the focus (outline or ring);
      // then the label is what must be on screen and uncovered.
      let shown: HTMLElement = el;
      let problem = "";
      if (invisible(el)) {
        const lab = (el as HTMLInputElement).labels?.[0];
        const ls = lab && getComputedStyle(lab);
        const ring = Boolean(ls && ((ls.outlineStyle !== "none" && parseFloat(ls.outlineWidth) > 0) || ls.boxShadow !== "none"));
        if (lab && ring && !invisible(lab)) shown = lab;
        else problem = lab ? "focused but invisible, and its label shows no focus ring" : "focused but invisible";
      }
      const rects = shown.getClientRects();
      const r = getComputedStyle(shown).display === "inline" && rects.length > 1 ? rects[0] : shown.getBoundingClientRect();
      if (problem) {
        // already failed
      } else if (r.right < 1 || r.left > vw - 1 || r.bottom < 1 || r.top > vh - 1) problem = "focused off-screen";
      else {
        const cx = Math.min(Math.max(r.left + r.width / 2, 0), vw - 1);
        const cy = Math.min(Math.max(r.top + r.height / 2, 0), vh - 1);
        const hit = document.elementFromPoint(cx, cy);
        if (!(hit && (hit === shown || shown.contains(hit) || (hit instanceof HTMLLabelElement && hit.control === el))))
          problem = `focused but covered by <${hit?.tagName.toLowerCase()}> "${((hit as HTMLElement | null)?.innerText ?? "").trim().slice(0, 30)}"`;
      }
      return { key: path(el), label, problem };
    });
    if (!f) {
      if (i > 0) break; // wrapped past the last control
      continue;
    }
    if (seen.has(f.key)) break;
    seen.add(f.key);
    if (f.problem) problems.push({ control: f.label, problem: f.problem });
  }
  expect(seen.size, `keyboard reaches controls on ${where}`).toBeGreaterThan(0);
  expect(problems, `keyboard focus problems on ${where}:\n${problems.map((p) => `  ${p.control}: ${p.problem}`).join("\n")}`).toEqual([]);
}

/**
 * Click like a person: only what's on screen and not covered. If it's below the fold, scroll with the mouse
 * wheel (vertical only; nobody shift-wheels to find a button). No auto scroll-into-view, so hidden controls fail.
 */
export async function userClick(page: Page, target: Locator) {
  const el = target.filter({ visible: true }).first();
  await expect(el).toBeVisible();
  const vp = page.viewportSize()!;
  for (let i = 0; i < 20; i++) {
    const box = await el.boundingBox();
    if (!box) break;
    const cy = box.y + box.height / 2;
    if (cy >= 0 && cy <= vp.height) break;
    // Wheel over the element's column so the right scroll container (page, panel or sheet) moves.
    await page.mouse.move(Math.min(Math.max(box.x + box.width / 2, 1), vp.width - 1), vp.height / 2);
    await page.mouse.wheel(0, Math.max(-vp.height * 0.8, Math.min(vp.height * 0.8, cy - vp.height / 2)));
    await page.waitForTimeout(50);
  }
  const box = await el.boundingBox();
  expect(box, "target has a box").not.toBeNull();
  const x = box!.x + box!.width / 2;
  const y = box!.y + box!.height / 2;
  expect(x >= 0 && x <= vp.width && y >= 0 && y <= vp.height, `target center (${Math.round(x)},${Math.round(y)}) is on screen`).toBe(true);
  const hits = await el.evaluate((node, [px, py]) => {
    const hit = document.elementFromPoint(px, py);
    return Boolean(hit && (hit === node || node.contains(hit) || (hit instanceof HTMLLabelElement && hit.control === node)));
  }, [x, y] as const);
  expect(hits, "nothing covers the target at its center").toBe(true);
  await page.mouse.click(x, y);
}
