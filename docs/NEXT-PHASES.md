Change of plan, plus 4 new phases. Work through them **strictly one at a time, in order**. Each phase ships on its own, so a problem in one never blocks or breaks the others.

## Rules for every phase
1. **Branch and feature flag.** Do each phase on its own branch (`phase-N-name`) behind a feature flag in `src/config/flags.ts` (default **on** once verified). If something goes wrong in production, flipping the flag hides it without a revert.
2. **Database changes come first.** Put each phase's database changes in their own small migration, add-only (no changes to existing tables or functions). If a phase needs a migration, stop and ask me to run `!pnpm db:push`. Don't build the rest of the phase on production until I confirm it ran.
3. **Done means all of these:**
   - lint, typecheck, unit tests, E2E (including social tests on the test project) and `pnpm validate` all pass;
   - the preview deploy looks right;
   - merged to main;
   - production checked (pages return 200, the feature works with the flag on, nothing else regressed);
   - phone and desktop screenshots in EN and 中文 reviewed.
4. **Report, then move on.** After each phase, send me a status of 5 lines or fewer (what shipped, the flag name, anything you need), log it in BUILD_LOG.md, then **automatically start the next phase**. Stop and wait only when you're blocked on me, such as a migration or a decision.
5. **If a phase fails** and you can't fix it within the phase: turn its flag off, log why, tell me, and continue with the next phase if it doesn't depend on it.
6. **No runtime or scheduled AI:** never add an LLM or AI API call to the site, Supabase or GitHub Actions without asking me first. AI work happens only in Claude Code sessions I start.
7. **Quota caps still apply:** 200/day for GetPlace and SearchText (keep runs at 180), and 350 map loads/day. Split bigger jobs across days.

---

## Phase 0: Data from me (no code)
- **Lincoln Station** (`lincoln-station-prospect-heights`): outlets = **few** ("a few, though not many"), noise = **moderate** ("not too loud, but not pin-drop quiet"). Add these with me as the source (Verified).
- **No full verification pass (H8).** Remove H8 as an M4 blocker. The crowd features below replace it.

## Phase 1: Single-report crowd confirmations (rule change)
1. **One signed-in report is enough to fill an unknown core detail.** Show it with low confidence and the label "Reported by 1 visitor · {date}" / "1位访客反馈". It counts toward coverage and the 3-of-5 listing rule right away.
2. **More reports raise the confidence:** 2 agreeing reports make it medium, 3 or more make it high.
3. **Conflicts:** the answer with the most reports wins. On a tie, the most recent wins, and the label says "Visitors disagree" / "访客意见不一".
4. **Existing values:** don't overwrite a detail that already has a medium or high sourced value unless 2 or more reports disagree with it. Low-confidence AI values can be replaced by a single report.
5. **Guards:**
   - Only signed-in users' reports count.
   - One report per user per detail per spot; they can change it.
   - Keep the existing rate limit.
   - Admins can reset a detail in /admin.
6. **Speed:** show reports on the site immediately, without waiting for the weekly pull request. Keep the weekly merge into spots.json as the permanent record.
7. Update the About page's methodology section, SPEC.md and the E2E tests.

## Phase 2: Spot suggestions as a real flow
1. **Visibility:** add a "+ Suggest a spot" / "推荐地点" button in the header (desktop) and the bottom sheet (mobile), and in empty search results ("Don't see your spot?" / "没找到你的地点？").
2. **Better form:** after name + neighborhood/link, ask the 5 core details (Wi-Fi, outlets, laptop policy, noise, hours) as optional quick taps. Count the submitter's answers as their crowd reports under the Phase 1 rules.
3. **Pipeline (no paid AI):** create `pnpm data:intake`. **I run it on demand from Claude Code**, so the research uses my Claude subscription and needs no API key. Given accepted submissions, it:
   - researches them with the same rubric and sources as M1, no guessing;
   - resolves place IDs within the 180/day cap;
   - adds them to spots.json through one pull request I review.

   A spot appears only once it has 3 of the 5 core details, counting the submitter's answers and OSM. The weekly refresh Action must **not** call any AI or LLM API. It only opens or updates a GitHub issue, "N accepted suggestions waiting for intake", so I know when to run it.
4. **Credit:** show "Suggested by {first name}" / "由{名字}推荐" on the spot page if the submitter was signed in and opted in.
5. **Abuse guard:** keep the 5/day limit for visitors who aren't signed in. Skip duplicates (same place ID, or same name and neighborhood).

## Phase 3: "Near me"
1. **Entry point:** a "📍 Near me" / "附近" button next to the filters, on mobile and desktop. Only ask for location when the button is tapped, never on page load. The existing distance sort should use the same code.
2. **On allow:**
   - move the existing map to the user's location with a "you are here" dot;
   - sort by distance;
   - show distance and walking time on every card ("0.3 mi · 6 min walk" / "约6分钟步行");
   - add quick chips: "≤10 min walk", "≤20 min walk", "Open now near me".
3. **On deny, error or no GPS:** show a friendly note and let people pick a neighborhood instead. Never ask again on its own; the button just retries. Handle the error callback, which the current code doesn't.
4. **Privacy:** location stays in the browser. Never send it to Supabase or analytics, never put it in the URL, and don't store it. Add one line to the privacy page saying so (both languages).
5. **Check-in nudge (keep this even if scope gets cut):** if the user is within ~75 m of a spot, show "Working at {spot}? Check in" / "在{地点}办公？签到一下" on that card.
6. **Cost:** don't create a new map instance or force extra map loads. Re-centering the existing map is free.
7. Add Playwright E2E tests with mocked geolocation for both the allow and deny cases.

## Phase 4: Finish M4 and the launch kit (only after Phases 1–3 are done or flagged off)
1. Re-run the data checks and coverage report. Put the final numbers in the About page (listed spots, coverage per core detail, crowd features).
2. Rewrite the launch drafts in launch/ (Slack, X, 小红书) so the main call to action is "help finish the map":
   - "Don't see your spot? Add it. Know one of these? Fill it in."
   - mention Near me;
   - list the 5–10 most-wanted gaps.

   Keep the placeholder for the original asker's name; I'll get their OK.
3. Add `launch/soft-launch-dm.md`: a short EN + 中文 DM I can send 5–10 friends, asking each to add or fill in their 3 regular spots.
4. Run the full suite, PageSpeed or Lighthouse on home and one spot page (mobile), and final screenshots in both languages. Then report M4 done.
