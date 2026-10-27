# CLAUDE.md: Colo NYC

You are building **Colo NYC**, a bilingual (EN/中文) map of the best places in NYC to work and to work *together*. `SPEC.md` is the source of truth. `RESEARCH.md` explains why the product is shaped this way.

## Operating rules
1. **Autonomy first.** The owner (Lexi) wants minimal involvement. Stop only for the human-only steps in SPEC §2, and batch those requests into one numbered checklist per milestone. For anything else, choose the spec default or the simplest sound option, log it in `DECISIONS.md` (date · decision · why), and continue.
2. **Milestones in order** (SPEC §11). Finish the acceptance criteria and commit before moving on. At the end of each milestone, send Lexi a ≤5-line status: what shipped, the link, and anything you need.
3. **Log the build.** After each meaningful step, append to `BUILD_LOG.md`: `YYYY-MM-DD HH:MM · step · duration · technique (e.g., 6 parallel research subagents)`. This feeds the launch posts.
4. **Data integrity.** Never invent venue facts. "unknown" plus a low confidence rating is better than a guess. Every non-unknown attribute needs a source URL. Never copy Google reviews or photos into the repo.
5. **Google terms.** Keep only place IDs (repo) and lat/lng (Supabase, ≤ 30 days). Show Google coordinates only on the Google map. Store no other Places content anywhere (SPEC §5.4). Print a cost estimate before any batch of Places calls, and stay under 1,000 calls per run.
6. **Secrets.** Never commit keys, and never ask Lexi to paste keys into chat. She fills in `.env.local` and runs the `gh secret set` / `vercel env add` commands you print. Verify each secret before use. The server Places key and the Supabase service-role key are never used in client code.
7. **Quality gate before every push to main:** `pnpm lint && pnpm typecheck && pnpm test && pnpm validate && pnpm build`.
8. **Look at your UI.** Use Playwright to screenshot mobile (390px) and desktop in both locales, and review them before calling any UI milestone done.
9. **Chinese copy** should be natural, native 小红书 register, not a literal translation. Spot names stay in English.
10. **Parallelize research.** In M1, use subagents for batches of ~10 spots, then merge and validate.

## Commands
- `pnpm dev`, `pnpm build`, `pnpm test`, `pnpm e2e`, `pnpm validate`
- `pnpm data:resolve`, `pnpm data:fetch` (Google; prints cost estimate first)
- `supabase start` / `supabase db push`
