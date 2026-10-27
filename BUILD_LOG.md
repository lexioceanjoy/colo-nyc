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
