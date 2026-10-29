# Build log

`YYYY-MM-DD HH:MM · step · duration · technique`

- 2026-10-27 15:30 · Kickoff: read SPEC/RESEARCH/CLAUDE.md, checked toolchain (Node 25, gh authed, no Docker) · 2 min · single agent
- 2026-10-27 15:32 · Started 4 parallel candidate-collection agents (Manhattan cafes, BK/Queens cafes, libraries+POPS, hotels/museums/other public) while scaffolding · ran ~9 min in background · 4 parallel research subagents
- 2026-10-27 15:33 · Scaffolded Next.js 16.4.3 + Tailwind 4 + next-intl + zod + Supabase + Vitest + Playwright · 3 min · create-next-app + docs-in-node_modules lookup
- 2026-10-27 15:36 · Core logic: Spot zod schema, Work Score, NY-time hours/open-now, URL filter state · 6 min · single agent
- 2026-10-27 15:38 · Bilingual messages (en + native 小红书-register zh), routing, proxy, design tokens (ballpoint-on-notebook) · 5 min · single agent
- 2026-10-27 15:40 · UI shell: header, locale toggle, explorer (desktop list+map, mobile bottom sheet), spot page with score breakdown and sourced attribute chips, 404, About stub · 8 min · single agent
- 2026-10-27 15:41 · Candidates merged: 202 found, 45 excluded with reasons (closures, laptop bans), curated to 132 → 13 research batches · 3 min · script + manual curation
- 2026-10-27 15:42 · Started 13 parallel research agents (~10 spots each) with schema, rubric, zh style guide and a per-batch checker · background · 13 parallel research subagents
- 2026-10-27 15:43 · Supabase schema: 11 tables, RLS, triggers (NY date, session limits, rate limit, 2-report auto-hide), `today_counts()` RPC, anon-safe `public_sessions` view, pg_cron cleanup · 6 min · single agent
- 2026-10-27 15:46 · Unit tests: score, hours (midnight + DST), NY-date boundaries, filter URL round-trip: 26 passing · 3 min · TDD-style fixtures
- 2026-10-27 15:47 · Re-checked Google Maps Service Terms (Oct 15 2026 version) and reviewed the-cafelist.com/nyc in Chrome · 3 min · browser automation
- 2026-10-27 15:49 · Data scripts: validate, check-batch, merge, resolve-places, fetch-places (cost estimate + 1k cap), NYC GeoSearch geocode, coverage report, env check · 6 min · single agent
- 2026-10-27 15:51 · First green build + Playwright smoke (desktop + 390px mobile) · 4 min · Playwright
- 2026-10-27 15:52 · Research batches finished: 125 spots written, 7 dropped with sources (closures, relocation, no daytime hours, unverifiable). The shared web-search budget (200) ran out mid-run, so agents fell back to direct fetches and **no gaps were guessed** · ~8 min wall-clock · 13 parallel research subagents
- 2026-10-27 16:00 · Merge + validate + NYC GeoSearch geocode (124/125) + coverage report: group-friendly 33 ✓, free public 36 ✓, neighborhood cap ✓, confidence medium+high 24% ✗ (target 55%) · 2 min · scripts
- 2026-10-27 16:01 · Gap-fill pass started (fetch-first: venue sites, library pages, guides) · background · 4 parallel subagents
- 2026-10-27 16:03 · First screenshot review (390px + 1440px, EN + 中文); fixed zh full-width punctuation, localized footer, list-only desktop layout when the map is unavailable · 6 min · Playwright screenshots + visual review
- 2026-10-27 16:12 · Gap-fill pass merged: 41 attributes unknown→known, several confidence corrections, 0 closures · ~7 min wall-clock · 4 parallel subagents (fetch-first; search budget exhausted)
- 2026-10-27 16:13 · **M1 shortfall logged** (SPEC §11: proceed anyway). Gaps list in data/gaps.md feeds H8 + correction prompts.

  ### Coverage report (125 live spots, 0 closed)
  - By category: cafe 71 · library 21 · hotel_lobby 18 · pops 9 · other_public 5 · museum 1
  - By borough: manhattan 77 · brooklyn 38 · queens 10
  - Group-friendly (4+): 34 (target ≥ 25) · Free public spaces: 36 (target ≥ 30)
  - Largest neighborhood: Williamsburg 9 (7%; cap 15%)
  - Confidence over 1375 cells (11 core attrs × spots, unknowns in denominator): high 6% · medium 19% · low 16% · unknown 59% → **medium+high 26%** (target ≥ 55%)
  - Known: wifi 70% · laptopPolicy 77% · hours 52% (target ≥ 80% each)
  - With place ID: 0 · fallbackLocation: 0
- 2026-10-27 18:07 · Keys verified (15/15 checks), schema pushed to prod + test Supabase, 123/125 place IDs resolved (129 Text Search calls, $0), coordinates fetched into place_geo (123 Details calls, $0), 4 permanent closures detected and hidden · 12 min · scripts + Places API (New)
- 2026-10-27 18:07 · **M1 done (with logged confidence shortfall)**

  ### Coverage report (121 live spots, 4 closed)
  - By category: cafe 67 · library 21 · hotel_lobby 18 · pops 9 · other_public 5 · museum 1
  - By borough: manhattan 75 · brooklyn 36 · queens 10
  - Group-friendly (4+): 33 (target ≥ 25) · Free public spaces: 36 (target ≥ 30)
  - Largest neighborhood: Williamsburg 8 (7%; cap 15%)
  - Confidence over 1331 cells (11 core attrs × spots, unknowns in denominator): high 6% · medium 19% · low 16% · unknown 59% → **medium+high 25%** (target ≥ 55%)
  - Known: wifi 70% · laptopPolicy 76% · hours 53% (target ≥ 80% each)
  - With place ID: 119 · fallbackLocation: 2
- 2026-10-27 18:14 · M2: real map live locally; fixed two bugs found by screenshot review (render loop React #185; duplicate map instance → no clusters + double billing) · 25 min · Playwright probes + systematic debugging
- 2026-10-27 18:16 · Gap-fill pass 2 (search budget back): +18 attributes from venue sites; laptopPolicy now 80% ✓, wifi 74%, hours 59%, medium+high 26% · ~8 min · 3 parallel subagents
- 2026-10-27 18:16 · About page draft (EN + 中文): method, rubric, live stats from data, timeline, excluded list (55 with reasons), credits · 15 min · single agent
- 2026-10-27 18:24 · Lighthouse mobile pass: perf 36→91/92/95 (home en/zh, spot), a11y 100, SEO 100, by deferring Maps on phones, dropping the 1.1MB CJK webfont for system fonts, and slimming the home payload · 30 min · Lighthouse + LCP PerformanceObserver probes
- 2026-10-27 19:15 · Vercel linked + env pushed (13 vars; public as config, secrets encrypted), GitHub secrets set; 'Hours unverified' label, top-5 filter chips on cards, mobile hero overlay + tap-to-load map, peek shows top 3 · 25 min · Vercel CLI + Playwright review
- 2026-10-27 19:19 · Production live at colo-nyc.vercel.app; refresh-places Action green (after fixing a `gh secret set --body -` bug that stored '-' as every secret) · 15 min · Vercel + GitHub Actions
- 2026-10-27 19:19 · Gap-fill pass 3 (hours → wifi, data/gaps.md): +34 attributes; wifi 74→88% ✓, hours 59→70%, laptopPolicy 80% ✓, medium+high 28% · ~7 min · 4 parallel subagents
- 2026-10-27 19:21 · Home share cards (EN + 中文) so the most-shared link gets a preview image · 8 min · next/og
- 2026-10-27 19:24 · Production checks: 390px + 1440px × EN + 中文 screenshots reviewed; Slackbot/Twitterbot get 200 PNG previews for home + spot (EN/中文); Lighthouse prod mobile 92 (median) / 90 / 98 / 96, desktop 98–100, a11y/BP/SEO 100 · 20 min · Playwright + Lighthouse
- 2026-10-27 19:24 · **M2 done** — live at https://colo-nyc.vercel.app

  ### Coverage report (121 live spots, 4 closed)
  - By category: cafe 67 · library 21 · hotel_lobby 18 · pops 9 · other_public 5 · museum 1
  - By borough: manhattan 75 · brooklyn 36 · queens 10
  - Group-friendly (4+): 33 (target ≥ 25) · Free public spaces: 36 (target ≥ 30)
  - Largest neighborhood: Williamsburg 8 (7%; cap 15%)
  - Confidence over 1331 cells (11 core attrs × spots, unknowns in denominator): high 7% · medium 21% · low 17% · unknown 55% → **medium+high 28%** (target ≥ 55%)
  - Known: wifi 88% · laptopPolicy 80% · hours 70% (target ≥ 80% each)
  - With place ID: 119 · fallbackLocation: 2
- 2026-10-28 10:11 · Privacy page (EN + 中文) shipped before any M3 social code: what's stored, who sees it, retention, deletion, contact; footer link; Playwright 200 test; SPEC M3 criterion added · 15 min · single agent
- 2026-10-28 10:24 · M3 social layer: Google sign-in (PKCE callback, admin seeding), onboarding/profile + delete account, check-ins (window/open-to/note, move/edit/checkout), sessions (host form, share page + OG, RSVP, attendees), reports with 2-report auto-hide, anonymous submit + corrections (honeypot + hashed-IP limit), admin (review, unhide, verify without deploy), live Verified badge, 'Has upcoming session' filter · ~2.5 h · single agent + TDD on time helpers
- 2026-10-28 10:24 · Verification: 8/8 anon-key RLS checks, 7/7 social E2E on the test project (check-in, auto-hide, sessions/RSVP/OG, admin verify, non-admin block, account deletion), privacy linked from footer + sign-in (E2E) · 20 min · Playwright + Supabase service-role fixtures
- 2026-10-28 15:24 · CI social E2E confirmed running (8 RLS + 7 social) · 5 min · GitHub Actions
- 2026-10-28 15:24 · Coverage pass 2: gap audit (208 → 193 missing core details), OSM import (+15 details, category-aware after catching bank/hotel mismatches), polite Playwright fetch (123 pages, 8 blocked and logged, 0 new facts), Foursquare terms checked (not usable) · ~1.5 h · scripts + 4 parallel subagents
- 2026-10-28 15:24 · Crowd confirmations (How's it here? after check-in, Know this? on unknowns, 2-person rule, weekly merge), 5-core listing rule (99 listed / 22 hidden), Brooklyn-first gaps list, venue outreach drafts, quota-sliced Places scripts · ~1.5 h · TDD + Playwright E2E (9/9 social)
- 2026-10-28 15:24 · M4 started: 小红书 3:4 share cards for spots and sessions + Share button · 25 min · next/og

  ### Coverage report (121 live spots, 4 closed)
  - By category: cafe 67 · library 21 · hotel_lobby 18 · pops 9 · other_public 5 · museum 1
  - By borough: manhattan 75 · brooklyn 36 · queens 10
  - Group-friendly (4+): 33 (target ≥ 25) · Free public spaces: 36 (target ≥ 30)
  - Largest neighborhood: Williamsburg 8 (7%; cap 15%)
  - Confidence over 1331 cells (11 core attrs × spots, unknowns in denominator): high 7% · medium 21% · low 18% · unknown 54% → **medium+high 28%** (target ≥ 55%)
  - Known: wifi 90% · laptopPolicy 80% · hours 80% (target ≥ 80% each)
  - With place ID: 119 · fallbackLocation: 2
  - **5 core details known:** wifi 90% · outlets 49% · laptopPolicy 80% · noise 41% · hours 80%
  - Spots by core details known: 5/5: 22 · 4/5: 38 · 3/5: 39 · 2/5: 12 · 1/5: 9 · 0/5: 1
  - **Listed (≥3/5): 99** · hidden for thin data: 22
- 2026-10-28 15:26 · Launch drafts in launch/ (Next Play Slack, X thread with alt text, 小红书 post + carousel plan, portfolio blurb), numbers from data · 15 min · single agent
- 2026-10-28 15:40 · Licenses (MIT code, ODbL 1.0 data with official SPDX text; Google place IDs excluded); Ground Support past-tense gotcha removed; Irving Farm WSq confirmed on the chain's locations page, Wi-Fi reset to unknown (now hidden at 2/5 until Lexi's pass) · 15 min · Playwright check
- 2026-10-28 15:49 · M4 final checks: prod screenshots 390/1440 × EN/中文 reviewed, analytics verified (v2 first-party path), About day-2 timeline, Lighthouse prod noisy (spot 79–99, home 79–94; local 91–94; a11y/BP/SEO 100), PSI quota exhausted · 40 min · Playwright + Lighthouse A/B
- 2026-10-28 17:34 · PSI follow-up shipped: system-serif LCP text, inline CSS (render-blocking CSS 0), legacy-JS traced to Next's built-in polyfill-module (not removable via browserslist). Prod Lighthouse mobile, 3 runs from local: spot 85/95/95 (median 95), home 94/94/94; a11y/BP/SEO 100. PSI API quota exhausted, so Lexi to confirm on pagespeed.web.dev · 45 min · Lighthouse A/B
- 2026-10-28 22:10 · PSI (Google servers, mobile) confirmed by Lexi: spot page Performance 100 (LCP 1.7s), home 100 (LCP 0.9s). Perf done. H7 declined (stay on vercel.app) · — · manual check
- 2026-10-29 16:51 · Phase 0: Lincoln Station outlets=few, noise=moderate (Lexi, Verified; noise was AI 'lively'); H8 dropped as M4 blocker; flags scaffold · 10 min · single agent
- 2026-10-29 17:08 · Phase 1 built on branch: crowd_details() (test project), crowd-rules + 10 unit tests, live merge at render + revalidate on report, labels, Not right?, admin reset, weekly merge on same rules, About/SPEC; social E2E 12/12 on test project (caught a missing report path for well-sourced details) · ~2 h · TDD + Playwright
