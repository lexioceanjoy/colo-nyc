# CLAUDE.md: Colo NYC

You are building **Colo NYC**, a bilingual (EN/中文) map of the best places in NYC to work and to work *together*. `SPEC.md` is the source of truth. `RESEARCH.md` explains why the product is shaped this way.

## Operating rules
1. **Autonomy first.** The owner (Lexi) wants minimal involvement. Stop only for the human-only steps in SPEC §2, and batch those requests into one numbered checklist per milestone. For anything else, choose the spec default or the simplest sound option, log it in `DECISIONS.md` (date · decision · why), and continue.
2. **Milestones in order** (SPEC §11). Finish the acceptance criteria and commit before moving on. At the end of each milestone, send Lexi a ≤5-line status: what shipped, the link, and anything you need.
3. **Log the build.** After each meaningful step, append to `BUILD_LOG.md`: `YYYY-MM-DD HH:MM · step · duration · technique (e.g., 6 parallel research subagents)`. This feeds the launch posts.
4. **Data integrity.** Never invent venue facts. "unknown" plus a low confidence rating is better than a guess. Every non-unknown attribute needs a source URL. Never copy Google reviews or photos into the repo.
5. **Google terms.** Keep only place IDs (repo) and lat/lng (Supabase, ≤ 30 days). Show Google coordinates only on the Google map. Store no other Places content anywhere (SPEC §5.4). Print a cost estimate before any batch of Places calls, and stay under 1,000 calls per run.
6. **Secrets.** Never commit keys, and never ask Lexi to paste keys into chat. She fills in `.env.local` and runs the `gh secret set` / `vercel env add` commands you print. Verify each secret before use. The server Places key and the Supabase service-role key are never used in client code.
7. **Quality gate before every push to main:** `pnpm lint && pnpm typecheck && pnpm test && pnpm validate && pnpm build && pnpm e2e`.
8. **Look at your UI as a user.** Tests that check what the code does aren't enough: check what a user can see and reach. Follow "UI quality gate" below before calling any UI work done.
9. **Chinese copy** should be natural, native 小红书 register, not a literal translation. Spot names stay in English.
10. **Parallelize research.** In M1, use subagents for batches of ~10 spots, then merge and validate.
11. **No stacked PRs.** Branch every fix from `main`. If a change truly depends on another PR, wait until that PR is merged, then branch from the updated `main`. Why: on 2026-10-30, a squash-merged base made every PR stacked on it conflict, and deleting its branch closed #18.

## UI quality gate
Why: the filter chip row was clipped in the desktop panel for days while every test passed, because Playwright scrolls and clicks for you.
1. **Acceptance criteria are user tasks.** Write UI criteria as things a person does: "a desktop user can apply every filter", "a phone user can check in", not "the filter bar renders 6 chips". Test each task end to end at the sizes it applies to, in EN and 中文.
2. **Click like a person.** Core-flow tests (filters, Near me, check-in, suggest, and every new task test) use `userClick` from `tests/e2e/support/reach.ts`. It clicks at the element's on-screen position with `page.mouse` and never auto-scrolls; it may only wheel down or swipe a row a user could swipe. Don't use `locator.click()` in those flows.
3. **Reachability and keyboard checks run in CI.** `tests/e2e/reachability.spec.ts` runs `assertAllControlsReachable` and `assertKeyboardFocusVisible` on every key page (`KEY_PAGES`) at 390, 768, 1024, 1280 and 1440px in both languages. Add every new page to `KEY_PAGES`. Fix the UI; never weaken the helper to make a page pass. If the helper itself is wrong, fix it in its own commit and say why.
4. **Visual baselines.** `tests/e2e/visual.spec.ts` compares the same matrix with `toHaveScreenshot`. Baselines are rendered on Linux only (CI). To approve a change, add the `visual:update` label to the PR, then run `gh run download <run-id> -n visual-baselines -D tests/e2e/__screenshots__`. Open the changed images, and commit them only if every change was intended. Say in the PR which ones changed and why. Never refresh baselines just to turn CI green.
5. **Independent UI review.** At every UI milestone, spawn a separate subagent that didn't write the code. Give it screenshots of the changed pages at every width above in both languages, and ask exactly: "find anything cut off, overlapping, unreachable, or truncated". Don't ask "does it look right?". Fix each finding or log in `DECISIONS.md` why it stays.

## Commands
- `pnpm dev`, `pnpm build`, `pnpm test`, `pnpm e2e`, `pnpm validate`
- `pnpm exec playwright test tests/e2e/reachability.spec.ts` (reachability + keyboard pass only)
- Visual baselines: `visual:update` PR label → `gh run download <run-id> -n visual-baselines -D tests/e2e/__screenshots__`
- `pnpm data:resolve`, `pnpm data:fetch` (Google; prints cost estimate first)
- `supabase start` / `supabase db push`
