# Coverage pass 2: extract from rendered venue pages (Colo NYC)

You extract facts from pages ALREADY fetched politely with Playwright (robots.txt respected). Do NOT fetch anything yourself: no WebFetch, WebSearch, curl or browser. Read only the local files.

Inputs:
- Your slugs: `data/batches/pages-input-NN.json`
- For each slug: `.cache/pages/<slug>/*.txt`. Each file starts with `URL:` (cite exactly that URL) and `FETCHED:`.
- `.cache/pages/index.json` lists what was blocked or disallowed (don't treat those as sources).
- Current record: `src/data/spots.json` (read only; don't edit).

Fill ONLY core details that are still "unknown" in the current record: **hours**, then **wifi**, **laptopPolicy**, **outlets**, **noise**. Rules from data/batches/PROMPT_RESEARCH.md apply:
- Use only what the page text says explicitly. "Free Wi-Fi" means wifi "ok" (speed unknown → note it); "no wifi" means "none"; "no laptops on weekends" means "weekdays_only"; "laptop-free zone/hours" means "restricted_areas" with a note. Outlets and noise only if the page states them.
- Hours: an official site or ordering page (Toast, Square, Clover, Linktree) counts as an official source → confidence "high" if the page is the venue's own and current, else "medium". Hours for a different location of a chain don't count. Holiday-only or "temporary" hours don't count. A hotel's bar hours aren't lobby hours, unless the page says the lobby/café is where people sit.
- Bilingual note when useful (en + natural 小红书 zh). checkedAt 2026-10-28.
- Never guess. If unclear, leave unknown and say why in the notes.

Output: `data/batches/fill-NN.json` with the FULL updated records for slugs you changed (copy each record from spots.json, change only what you filled), plus `data/batches/fill-NN-notes.md` (slug: filled what, from which URL; or why not). Run `pnpm exec tsx scripts/check-batch.ts data/batches/fill-NN.json` and fix errors. Reply in ≤4 lines.
