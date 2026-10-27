# Gap-fill pass (Colo NYC)

Your job is to fill in "unknown" attributes on existing spot records. Same rules as data/batches/PROMPT_RESEARCH.md: read it first. Never guess, cite only what you saw, and Google Maps is never a source.

Your slugs are in `data/batches/fill-input-NN.json`. Each slug's current record is in `src/data/spots.json` (read it, but **do not edit spots.json**).

Priorities, in order, because these are the M1 targets:
1. **hours** (from the venue's own site, a library system page, or an official IG/linktree snippet)
2. **wifi**
3. **laptopPolicy** (look for weekend bans, laptop-free hours, "no laptops" signage)
4. outlets, seating, noise, then the rest.

Strategy: the shared WebSearch budget may be exhausted. Start by **fetching** URLs directly: the record's `website`, its existing source URLs, and known guides (halfhalftravel.com laptop-friendly guides for Manhattan and Brooklyn, wfhishnyc.substack.com posts, theinfatuation.com work-cafe guide, bklynlibrary.org/locations/<branch>, queenslibrary.org/about-us/locations/<branch>). Use WebSearch only if it works, and stop calling it once it reports the limit. Don't retry blocked sites (nypl.org, instagram) and don't try to get around bot walls.

You may also **raise confidence** on an already-known value if you find a second independent recent source (add the URL), or **lower** it if you find a conflict (explain in `note`, both languages). Update `checkedAt` to 2026-10-27 for any attribute you touch. Gotchas, blurbs and busyTimes may be improved too (en + natural 小红书-register zh, same count).

If you find a spot is permanently closed, list it in the notes and leave it out of the output.

Output: `data/batches/fill-NN.json`, a JSON array of the **full updated Spot records** for every slug you changed (leave out unchanged ones), plus `data/batches/fill-NN-notes.md` (per slug: what changed and the source). Run `pnpm exec tsx scripts/check-batch.ts data/batches/fill-NN.json` and fix every error. Reply with ≤4 lines: records updated, attributes filled (unknown→known), closures found.
