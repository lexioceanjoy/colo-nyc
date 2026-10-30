# SPEC: Colo NYC, an AI-built map of the best places to work & work *together* in NYC

> Working name: **Colo NYC** (中文: **纽约同城办公地图**). Rename via `src/config/site.ts`; see §13.
> Owner: Lexi (lexiyuewang@gmail.com). Builder: Claude Code.
> Companion docs: `RESEARCH.md` (market scan), `CLAUDE.md` (operating rules), `KICKOFF.md` (first prompt).

---

## 0. How to use this spec (for Claude Code)

- Work **milestone by milestone** (§11). Each one ends deployable and has acceptance criteria. Don't start the next milestone until the current one passes.
- **Be autonomous.** Lexi wants this built with as little of her time as possible. Only stop for the **human-only steps in §2**. For any other ambiguity, pick the default in this spec (or the simplest reasonable option), record it in `DECISIONS.md`, and keep going.
- Keep `BUILD_LOG.md` up to date: a timestamped line per meaningful step (what was built, how long it took, which AI technique was used). Lexi will turn it into the "how I built this" post, so it is part of the deliverable.

---

## 1. Product

### 1.1 Problem
Someone in Next Play's Slack asked where people cowork and colocate in NYC. Existing answers are static cafe lists with stale, unexplained data (see `RESEARCH.md`). None of them help people **find each other** to work side by side.

### 1.2 Purpose
1. **Portfolio piece:** shows Lexi can ship a polished, useful tool for a niche problem quickly, AI-native end to end.
2. **Networking piece:** the product brings people together IRL, starting with Next Play.

### 1.3 Audience
- Primary: Next Play members (tech/product folks, many between roles or building), NYC-based or visiting.
- Secondary: NYC remote workers and founders (Twitter/X), and Chinese-speaking NYC remote workers and visitors (Xiaohongshu).

### 1.4 v1 scope (locked decisions)
| Decision | Choice |
|---|---|
| Core | Curated map **plus** social layer: "I'm here today" check-ins and hosted cowork sessions |
| Spot types | Laptop-friendly cafes · free public spaces (libraries, POPS/atriums, hotel lobbies, museum cafes) · group-friendly spots (a flag, not a separate type) |
| Excluded | Paid day-pass coworking (WeWork, Industrious, Croissant). At most an "also see" link on the About page |
| Language | English + Simplified Chinese with a toggle |
| Data | Google Places API for place identity (place ID), coordinates, and closure detection only. Everything shown about a spot, **including hours**, is our own researched data with confidence and sources (Google terms forbid storing most Places content; see §5.4) |
| Geography | Manhattan + Brooklyn + Long Island City / Astoria. Target **~120 high-quality spots**, not hundreds |

### 1.5 Differentiators (each must show up in the UI)
1. **Colocate:** see who's working where today; join or host a session.
2. **Honest data:** every work attribute shows its source, confidence, and last-checked date, with an **AI-researched** vs **Verified** badge.
3. **Work gotchas:** weekend laptop bans, time limits, purchase required, laptop-free zones, crowded hours.
4. **Beyond cafes:** free public spaces and a group-friendly filter.
5. **Bilingual:** native 中文, not machine-translated UI chrome.

### 1.6 Non-goals (v1)
Native apps, payments, booking, reviews or star ratings by users, DMs or chat, cities other than NYC, paid coworking inventory.

---

## 2. Human-only steps (Lexi). Everything else is Claude Code's job

Claude Code: when you reach a step that needs one of these, give Lexi an exact, numbered click-path checklist, wait, then verify (e.g., test the key) before continuing. **Batch them**: ask for all of M0's items in one message.

| # | Step | When | Notes |
|---|---|---|---|
| H1 | Run `gh auth login` locally. Claude Code then creates the repo (`gh repo create colo-nyc --public`) | M0 | Public repo is better for the portfolio. Nothing from Google goes into the repo (§5.4). |
| H2 | Google Cloud project with billing; enable **Maps JavaScript API** and **Places API (New)**; create a **Map ID** (JavaScript, vector). In Map Styles, create a muted **light** and a **dark** style and attach both to the Map ID | M0 | Custom JSON styles are ignored once a Map ID is set, so styling has to be done by hand in the console. If Lexi skips the styles, code falls back to the default look. |
| H3 | Two API keys: **browser key** (Maps JS API only; referrers `http://localhost:3000/*`, `https://colo-nyc.vercel.app/*`, prod domain) and **server key** (Places API (New) only) | M0 | Do **not** allow `*.vercel.app` (any Vercel project could use the key). Preview deploys run without the map. The server key is used only in scripts and GitHub Actions. |
| H4 | Cost guardrails: budget alerts at $10 and $25; **quota cap on Maps JS "Map loads" ≈ 600/day** | M0 | Free tier is 10k loads/month. The cap keeps the worst-case viral month around $50. The list view works if the map is capped (§6.6). |
| H5 | Supabase project (free tier) | M0 | Needed from M1 on (it stores Google coordinates, §5.4). |
| H5b | **Google sign-in:** OAuth client (Web) in the same Cloud project with the Supabase callback URL as the redirect URI; consent screen in production mode with app name and privacy URL; paste the client ID/secret into Supabase → Auth → Google | M3 | Chosen over email magic links: Supabase's built-in email only reaches project team members, and real email would need SMTP plus a domain. |
| H6 | Vercel account linked to the repo; create a **Deploy Hook** URL | M2 | Claude Code sets env vars with `vercel env` if the CLI is authed. |
| H7 | Optional domain (check availability of `colo.nyc` or an alternative) | M4 | Default: ship on `colo-nyc.vercel.app`. |
| H8 | Spot-check verification: Lexi marks ~15–20 spots she personally knows as **Verified** in `/admin` | M4 | Seeds the trust badge. |
| H9 | Launch posts (Claude Code drafts, Lexi posts) | M4 | §12 |

**How secrets reach Claude Code:** Claude Code writes `.env.example`. Lexi copies it to `.env.local` and fills in the values herself; she never pastes keys into chat. She also runs the `gh secret set …` / `vercel env add …` commands Claude Code prints. Before using any secret, Claude Code checks that it is present (`gh auth status`, the env var is non-empty, a test call succeeds). In a terminal session, Claude Code ends its turn with the checklist and resumes when Lexi says "done". Until then it does every task that doesn't need the secrets.

---

## 3. Tech stack (defaults; change only with a logged reason)

- **Next.js** (latest stable, App Router, TypeScript strict), **Tailwind CSS**, **pnpm**. Record the exact versions of Next.js and next-intl in `DECISIONS.md` and follow their current docs (for example, Next 16 renamed `middleware.ts` to `proxy.ts`).
- **Rendering:** home, spot, and about pages are **static/ISR**: use `generateStaticParams` and next-intl's `setRequestLocale`, read no cookies in these pages, and revalidate daily or through the deploy hook. Social data (counts, check-ins) is fetched **client-side** after load, so pages stay fast and cacheable.
- **Map:** Google Maps JS via `@vis.gl/react-google-maps`, using Advanced Markers and a custom-styled Map ID, plus `@googlemaps/markerclusterer`.
  - *Why Google and not MapLibre:* Google's terms forbid showing Places API content on a non-Google map (Maps Service Terms, Places §B.14.2).
- **i18n:** `next-intl` with `/en` and `/zh` route prefixes; default locale inferred from `Accept-Language`; toggle persists in a cookie.
- **Data (curated):** JSON in the repo validated with **zod** (`src/data/spots.json`). Static, versioned, diffable.
- **Google coordinates:** Supabase table `place_geo` (not in the repo), refreshed weekly by a GitHub Action and read at build/ISR time (see §5.4).
- **Social backend:** **Supabase** (Postgres + Auth with **Google sign-in** + Row Level Security). Client is `@supabase/ssr`. Privileged actions (admin, anonymous submit, account deletion) run as **server actions with the service-role key**, never from the client.
- **Hosting:** Vercel (free). **Analytics:** Vercel Web Analytics (cookieless).
- **OG/share images:** `next/og`.
- **Tests:** Vitest (logic) + Playwright (smoke E2E).
- No Anthropic API key needed: Claude Code does the research in-session with its own web tools (§5.2).

---

## 4. Data model

### 4.1 Curated spot (`src/data/spots.json`, array of `Spot`)

```ts
type Confidence = "high" | "medium" | "low";
type Attr<T> = {
  value: T | "unknown";
  confidence: Confidence;
  note?: { en: string; zh: string };   // short, e.g. "Outlets along the back wall only"
  sources: string[];                   // URLs; "lexi" if personally verified
  checkedAt: string;                   // ISO date
};

type Spot = {
  slug: string;                        // "devocion-williamsburg"
  name: string;                        // official English name (don't translate)
  nameZh?: string;                     // only if a common Chinese name exists
  googlePlaceId: string | null;        // storing place IDs long-term is allowed; null for public spaces Google can't resolve
  fallbackLocation?: { lat: number; lng: number; source: string }; // only when googlePlaceId is null; must come from a non-Google source (NYC Open Data POPS, OSM)
  address: string;                     // our own copy, from the venue's site or NYC Open Data, not Google
  website?: string;                    // venue's own site/Instagram
  hours: Attr<{ day: 0|1|2|3|4|5|6; open: string; close: string }[]>; // "HH:MM" 24h, NY time; close < open = past midnight. Sourced from the venue's site/Instagram
  category: "cafe" | "library" | "pops" | "hotel_lobby" | "museum" | "other_public";
  borough: "manhattan" | "brooklyn" | "queens";
  neighborhood: string;                // key into src/data/neighborhoods.ts (en+zh labels)
  free: boolean;                       // true = no purchase expected

  work: {
    wifi: Attr<"strong" | "ok" | "weak" | "none">;
    outlets: Attr<"many" | "some" | "few" | "none">;
    seating: Attr<"plenty" | "moderate" | "limited">;
    noise: Attr<"quiet" | "moderate" | "lively">;
    laptopPolicy: Attr<"welcome" | "weekdays_only" | "restricted_areas" | "discouraged">;
    timeLimitMin: Attr<number | null>; // null = no limit
    callsOk: Attr<boolean>;
    groupCapacity: Attr<"solo" | "2-3" | "4-6" | "7+">; // max group that can reliably sit together
    bookableSpace: Attr<boolean>;      // e.g., library study rooms
    restroom: Attr<"customers" | "public" | "none">;
    busyTimes?: { en: string; zh: string };   // "Packed weekends 11–3"
  };

  blurb: { en: string; zh: string };   // ≤ 220 chars en; natural zh (not literal)
  gotchas: { en: string[]; zh: string[] }; // the stuff other lists don't say
  bestFor: ("deep_focus" | "calls" | "group" | "meetings" | "long_day" | "quick_session")[];

  status: "ai_researched" | "verified";
  verifiedBy?: string; verifiedAt?: string;
  addedAt: string; updatedAt: string;
};
```

Rules:
- **Never** copy Google content (reviews, editorial summaries, photos) into `spots.json`. Blurbs and gotchas are our own writing, synthesized from several sources.
- Unknown is fine; a fabricated value is not. If sources disagree, use `confidence: "low"` and explain in `note`.
- Chinese text should read like a native NYC 小红书 user wrote it (natural, concise, with practical terms like 插座, 安静, 适合打电话). Don't translate word for word.

### 4.2 Google coordinates (Supabase `place_geo`, generated by script, never hand-edited, never committed)

```
place_geo(place_id text pk, lat double, lng double, fetched_at timestamptz)
```
- Public read is allowed. Only the service role writes. Rows older than 30 days are deleted by the refresh job and never served.
- The closure check uses `businessStatus`. The script turns it into **our own** flag: it sets `closed: true` on the spot in `spots.json` and logs it. The raw Google value is never stored.
- "Open in Google Maps" links are built from the place ID: `https://www.google.com/maps/search/?api=1&query=<name>&query_place_id=<id>`, with no stored Google URI.

### 4.2b Visitor reports (Phase 1, 2026-10-29; supersedes the 2-person rule)
- Signed-in users report any of the 5 core details (Wi-Fi, outlets, laptop policy, noise, hours) in `detail_votes`: one report per user per detail per spot, changeable, under the existing rate limit.
- `crowd_details()` returns the winning value per spot detail: most distinct reporters wins; on a tie the most recent wins and `disagree` is true.
- Applied at render time (`src/lib/crowd-rules.ts`) and shown immediately (a report revalidates the spot and home pages): 1 report → low confidence ("Reported by 1 visitor · date" / "1位访客反馈"), 2 → medium, 3+ → high; a tie is labeled "Visitors disagree" / "访客意见不一".
- Unknown or low-confidence researched values can be filled or replaced by a single report. Medium/high values change only when ≥2 reports agree on a different value.
- Crowd values count toward coverage and the 3-of-5 listing rule. Unlisted spots stay reachable by direct link (noindex) so people can fill them in.
- Admins can reset a detail's reports in /admin. A weekly job merges the same result into spots.json (source "community") as the permanent record, via PR.
- Flag: `crowdSingleReport` in `src/config/flags.ts`.

### 4.2c Spot suggestions (Phase 2, 2026-10-29)
- Entry points: "+ Suggest a spot" / "推荐地点" in the desktop header, the mobile bottom sheet, and empty results ("Don't see your spot?" / "没找到你的地点？"). Flag: `suggestFlow`.
- Form: name, neighborhood, address or link, type, plus optional one-tap answers for the 5 core details. Extras are stored in `submission_extras` (service role only). Signed-in submitters' answers become their visitor reports when the spot is added; anonymous answers are research hints only.
- Abuse: 5/day per hashed IP (anonymous) or per user (signed-in), honeypot, duplicates skipped (same normalized name + neighborhood, on the map or already queued; same Google place ID at intake).
- Intake: `pnpm data:intake` (prepare) → research agents in a Claude Code session → `pnpm data:intake --finalize` (validate, place IDs ≤180/day, geocode + OSM, visitor reports, credit, one PR). **No AI/LLM API calls anywhere in the site, Supabase or GitHub Actions.** The weekly refresh only opens or updates the issue "N accepted suggestions waiting for intake".
- Credit: "Suggested by {first name}" / "由{名字}推荐" when the signed-in submitter opted in (`suggestedBy` in spots.json).

### 4.3 Work Score (computed in `lib/score.ts`, never stored)
0–10, a weighted sum of mapped attribute values: wifi 25%, outlets 20%, seating 15%, noise 15%, laptopPolicy 15%, timeLimit 10%. Unknowns count as the neutral midpoint and **cap the confidence badge**. The UI always shows the breakdown on hover/tap. A score without an explanation is not allowed.

### 4.4 Supabase schema (`supabase/migrations/*.sql`)

```
profiles(id uuid pk = auth.users.id, display_name text ≤40, headline text ≤80,
         link_url text null (https only), community_tags text[] default '{}',  -- e.g. {'next_play'} self-declared
         locale text default 'en', created_at)
checkins(id uuid pk, user_id fk, spot_slug text, ny_date date,   -- America/New_York calendar date
         window text check in ('morning','afternoon','evening','all_day'),
         open_to text[] check subset of ('chat','lunch','quiet_cowork','feedback'),
         note text ≤120, hidden bool default false, created_at,
         unique(user_id, ny_date))                                 -- one active check-in per person per day (upsert to move)
sessions(id uuid pk, host_id fk, spot_slug, starts_at timestamptz, ends_at timestamptz,
         title text ≤60, description text ≤300, capacity int 2..12, community_tag text null,
         hidden bool default false, created_at)
rsvps(session_id fk, user_id fk, created_at, pk(session_id,user_id))
reports(id, reporter_id, target_type in ('checkin','session','profile'), target_id, reason ≤200, created_at)
spot_submissions(id, user_id null, name, address_or_link, category, why ≤300, status in ('new','accepted','rejected'), created_at)
corrections(id, user_id null, spot_slug, field, suggested ≤200, created_at, status)
spot_overrides(slug text pk, status text in ('ai_researched','verified'), verified_by text, verified_at timestamptz)
rate_limits(key text, ny_date date, count int, pk(key, ny_date))   -- key = user id or sha256(ip + salt)
admins(user_id uuid pk)                                            -- seeded from ADMIN_EMAILS by a server script
```
All foreign keys to `profiles`/`auth.users` use `ON DELETE CASCADE`.

RLS / rules (implement time- or row-dependent rules as **triggers**, not CHECK constraints):
- **Anonymous users** may read:
  - aggregates through the RPC `today_counts()` → `{spot_slug, count}` for the current NY date;
  - sessions through the view `public_sessions` (title, spot, time, capacity, RSVP count; no host or attendee identity), so session share pages and OG images work without login;
  - `spot_overrides` and `place_geo`.
  They never see names.
- **Authenticated users** read check-ins, sessions, and the profile fields display_name, headline, and link where `hidden=false`. The privacy page says plainly that anyone who signs in can see who is checked in.
- Users insert, update, and delete only their own rows.
- A BEFORE INSERT/UPDATE trigger on `checkins` **sets `ny_date := (now() at time zone 'America/New_York')::date`**, ignoring whatever the client sends.
- Session triggers enforce: at most 3 upcoming per host; `starts_at` between now and now + 30 days; duration ≤ 10h.
- Rate limit trigger: at most 20 writes per user per NY day (`rate_limits`).
- Report trigger: 2 distinct reporters → `hidden=true` on the target.
- Every function that bypasses RLS (`today_counts`, the report and rate-limit triggers) is `SECURITY DEFINER` with `set search_path = ''`.
- Admin checks use the `admins` table (RLS can't read env vars).
- Anonymous `/submit` and corrections go through a server action that uses the service-role key, rate-limited by hashed IP (5/day) plus a honeypot field.
- "Delete my account" is a server action: `auth.admin.deleteUser`, and the cascades remove everything else.
- A nightly `pg_cron` job deletes check-ins older than 7 days and `place_geo` rows older than 30 days.

---

## 5. Data pipeline (M1)

All scripts live in `scripts/` (TypeScript, run with `tsx`) and are idempotent. Outputs go into the repo except candidates scratch.

### 5.1 Collect candidates → `data/candidates.csv`
Claude Code researches with web search across these source types. Collect ~200 candidates, then curate down to ~120.
- Existing lists: Half Half Travel (Manhattan + Brooklyn guides), Savour by Shortlist, Freaking Nomads, Laptop Friendly NYC, Built In "free places to work", Reddit r/AskNYC and r/nyc threads on "work from cafe / laptop friendly", Eater/Time Out "work-friendly cafes" lists, The Cafe List (if readable).
- Public spaces: NYC Open Data **POPS** dataset (filter for indoor atriums with seating/tables), NYPL / BPL / QPL standout branches (study rooms, long hours), hotel lobbies known to welcome laptops, museum cafes or members' lounges that are free to enter.
- Target mix: ~70 cafes, ~35 free public spaces, rest flexible. At least 25 spots must be group-friendly (`groupCapacity` 4-6 or 7+). Spread across neighborhoods; no neighborhood above 15% of spots.
- Columns: `name, category, borough, neighborhood_guess, address_hint, source_urls (pipe-sep), why_included`.
- Exclude anything with a reported closure, and cafes with clear "no laptops ever" policies (log them in `data/excluded.csv` with the reason; that list is content for the About page).

### 5.2 Research work attributes → `src/data/spots.json`
- Process in batches of ~10. **Use parallel subagents** (one per batch) when available. Each subagent gets: the batch, the `Spot` schema, the rubric below, and the instruction to cite URLs for every non-unknown attribute.
- Rubric:
  - `high` = 2+ independent recent (≤18 mo) sources agree, or an official policy page.
  - `medium` = one credible recent source.
  - `low` = old or conflicting sources.
- Check each venue's own site for laptop policy and **hours** (weekend laptop bans are common). Instagram, Reddit, and Yelp often block automated fetching. Use their snippets from web search results instead, and when you can't read a source, don't cite it.
- Write blurbs and gotchas in **both languages**.
- Record the batch timing in `BUILD_LOG.md`.

### 5.3 Resolve and fetch Google data
- `scripts/resolve-places.ts`: for each spot without `googlePlaceId`, call Places **Text Search (New)** with field mask `places.id,places.displayName,places.formattedAddress` (keep the mask minimal for cost) and the query `"{name} {neighborhood} New York"`. Auto-accept only when the name similarity is high and the address is in the expected borough. Otherwise write to `data/resolve-review.md` and pick the best match with a logged reason. Lexi does not need to review.
- `scripts/fetch-places.ts`: Place Details (New) for each place ID with field mask **`location,businessStatus` only**. Upsert lat/lng into Supabase `place_geo`; turn `CLOSED_PERMANENTLY` into our own `closed` flag (§4.2). Keeping the mask small keeps calls in the cheap tiers (~120 spots × 4 runs/month is well inside the free monthly allowance). Before calling, print an **estimated cost per SKU tier**, and abort if a run would exceed 1,000 calls.
- `scripts/validate.ts` (also runs in CI and `pnpm build`): zod-validate every spot; check both languages are present; every non-unknown attribute has ≥1 source; slugs are unique; every non-closed spot has coordinates (`place_geo` row ≤ 30 days old, or `fallbackLocation`); list closed businesses. When Supabase env vars are missing (e.g., in CI for forks), skip the coordinate check with a warning.

### 5.4 Google terms compliance (non-negotiable)
Per the Maps Service Terms (June 2026 version; **re-check the current version in M0** and log any change): **place IDs** may be stored long-term; **lat/lng** may be cached for **≤ 30 days**; other Places content may not be stored; Places content must not be used with a non-Google map. Hence:
- The only Google data we keep is the place ID (repo) and lat/lng (Supabase, ≤ 30 days). **Nothing from Google goes into the public repo** except place IDs.
- Google coordinates appear only on the Google map. In the map-less list fallback (§6.6), show distance and position using our own `address`, not Google coordinates.
- Weekly GitHub Action `.github/workflows/refresh-places.yml`:
  - `permissions: contents: read`; secrets for the server key, the Supabase service role, and the Vercel deploy hook.
  - Runs `fetch-places` then `pnpm validate`, then calls the **Vercel deploy hook** (pushes from `GITHUB_TOKEN` don't trigger CI and may not deploy).
  - If the closed flag changed, open a PR instead of pushing (use `peter-evans/create-pull-request` with `contents: write, pull-requests: write`).
- No Google ratings, reviews, hours, or photos in v1. Hours are our own researched attribute. Cards use a category illustration plus our own text.
- Show Google attribution on the map, as the Maps JS API renders it by default.

---

## 6. UX

Design direction: editorial and calm, "a friend's well-kept notebook," not a SaaS dashboard. Warm off-white paper background, one strong accent color, a characterful serif for headings plus a clean sans for UI, and Noto Sans SC for Chinese. Map style is muted and low-saturation so markers pop. Marker color encodes category; a small pulsing dot means "people here today." Full dark mode. Mobile-first: most traffic will come from Slack, X, and XHS links opened on phones.

### 6.1 Home `/[locale]`
- **Desktop:** filter bar on top, list (left, 400px) and map (right), synced: hovering a card highlights its marker, and moving the map filters the list to the viewport (with a "search this area" toggle).
- **Mobile:** full-screen map with a draggable bottom sheet (peek shows the count and top 3; expanded shows the full list) and a list/map toggle.
- **Header:** logo, EN/中文 toggle, "Today" (count of people checked in), "Sessions," sign in/avatar.
- **Hero line (first visit, dismissible):** "The best places in NYC to work, and to work *together*." / "纽约最适合办公的地方，也是遇见同行的地方。"

### 6.2 Filters (chips; state lives in the URL query so links are shareable)
Open now · Free (no purchase) · Category (Cafe / Library / Public atrium / Hotel lobby / Museum) · Borough → neighborhood · Strong Wi-Fi · Lots of outlets · Quiet · Calls OK · Group-friendly (4+) · Laptops OK on weekends · No time limit · **People here today** · Has upcoming session.
Sort: Work Score (default) · Distance (if geolocation granted) · Most people today.

### 6.3 Spot card / detail `/[locale]/spot/[slug]`
Name, category, neighborhood, open-now/hours (from our researched hours, with a "per venue site, checked <date>" note), **Work Score with breakdown**, attribute chips (each tappable to show confidence, note, sources, and checked date), gotchas, blurb, best-for tags, "AI-researched" or "Verified by Lexi" badge, small Google map, "Open in Google Maps," "Suggest a correction." Social block: "3 people here today" → list (signed-in only) → "I'm here too" button; upcoming sessions → RSVP; "Host a session here." Unique OG image per spot (name, score, top 3 attributes, locale-aware).

### 6.4 Check-in flow
Tap "I'm here today" → sign in if needed (Google; first time asks for display name, headline, optional link, and an optional "I'm in Next Play" tag) → choose window, open-to, and optional note → done. Check-ins expire at NY midnight. Users can edit or move a check-in (upsert).

### 6.5 Sessions `/[locale]/sessions`
Upcoming sessions list (filter by community tag, borough, date) and a "Host a session" form (pick spot from search, date/time, capacity, title, description). Each session gets its own share page with an OG image, which works as the invite link to drop in Slack. RSVP shows "x/y going." Hosts see attendee names and links.

### 6.6 Graceful degradation
If Maps JS fails or the quota is hit, show the list view with a notice. All spot data and the social features still work. Pages are server-rendered for SEO and link previews (fixing the JS-only weakness of the closest competitor).

### 6.7 Other pages
- `/about`: about 5 short lines per language: what it is; how it works (researched by AI, filled in by visitors); a "Suggest a spot" link; data credits (© OpenStreetMap contributors (ODbL), map © Google, data licensed under ODbL); links to Privacy and GitHub. The build story lives in `BUILD_LOG.md` and the README, not on the site. The OSM credit is also in the site footer.
- `/submit`: suggest a spot (no login required; honeypot field + rate limit).
- `/admin` (emails in `ADMIN_EMAILS` env): review submissions, corrections, and reported/hidden content; toggle `verified` for a spot. Verified status is written through a Supabase table `spot_overrides(slug, status, verified_at)` merged at runtime, so Lexi can verify without a git commit.
- 404 and empty states, both bilingual and friendly.

### 6.8 Accessibility & performance
WCAG AA contrast, keyboard-navigable list and filters, every marker reachable through the list. Lighthouse mobile ≥ 90 for performance, accessibility, best practices, and SEO on home and spot pages. On mobile, first paint is the bottom sheet over a lightweight static placeholder (CSS or SVG neighborhood outline, not Google). The Google map loads on idle or on first interaction.

### 6.9 OG and share images (`next/og`)
Use the **Node runtime**, not edge. `next/og` needs TTF/OTF fonts (not woff2), and full Noto Sans SC is too large. For each image, fetch a subset from Google Fonts CSS2 with `&text=<the exact characters>` and pass the TTF bytes, or bundle one subset font covering the site's characters. Wrap long CJK titles and test the longest zh spot blurb.

---

## 7. Privacy & safety
- Social features are opt-in. Anonymous visitors see only counts, never names.
- Check-ins are same-day only and auto-delete after 7 days. Show no exact times beyond the morning/afternoon/evening window.
- Profiles: display name can be first name only. `link_url` must be https and is shown as a domain chip.
- Report button on every check-in, session, and profile; auto-hide after 2 reports. A short community note ("Be kind. This is for working together, not selling.") is shown at sign-up.
- Minimal privacy page (what is stored, how to delete your account). An in-app "Delete my account" action cascades all rows.

---

## 8. i18n details
- All UI strings live in `messages/en.json` and `messages/zh.json`. Write the zh strings as a native speaker would, not literal translations. Neighborhood labels are bilingual in `neighborhoods.ts`; keep the English name in parentheses for searchability (e.g., 威廉斯堡 (Williamsburg)).
- Spot names stay in English. Dates and times are formatted per locale. `hreflang` alternates are set and the sitemap includes both locales.

---

## 9. Repo layout

```
src/app/[locale]/(pages)…   src/components/…   src/lib/{score,hours,supabase,i18n}.ts
src/data/{spots.json,neighborhoods.ts}   src/config/site.ts
messages/{en,zh}.json   scripts/*.ts   supabase/migrations/*.sql
data/{candidates.csv,excluded.csv,resolve-review.md}   tests/{unit,e2e}
.github/workflows/{ci.yml,refresh-places.yml}
CLAUDE.md  SPEC.md  RESEARCH.md  DECISIONS.md  BUILD_LOG.md  README.md
```

---

## 10. Quality gates
- `pnpm lint && pnpm typecheck && pnpm test && pnpm validate && pnpm build` must pass before every commit to `main` (CI runs them too).
- Unit tests: `score.ts`, `hours.ts` (open-now across midnight and DST, in America/New_York), NY-date boundaries for check-ins, filter/URL-state round-trip.
- Playwright smoke test: home loads in both locales; filters change the result count; spot page renders the score breakdown; anon users see counts but no names; a test user can check in, see themselves, and check out.
  - **Test auth:** don't drive Google OAuth. In Playwright global setup, create a test user and session with the service-role key (`auth.admin.createUser` + `generateLink` → exchange for a session), against a separate Supabase **test project**, or local `supabase start` if Docker is available. Never run this against the production project.
- Before closing M2 and M4, take screenshots at mobile (390px) and desktop (1440px) in both locales and look at them yourself. Fix anything ugly before reporting done.

---

## 11. Milestones & acceptance criteria

**M0: Setup (≈1 hr of Claude time)**
Scaffold the repo, CI, `.env.example`, `CLAUDE.md`, `DECISIONS.md`, and `BUILD_LOG.md`. Send Lexi one consolidated checklist for H1–H5. Verify both Google keys with a test call and Supabase with a test query. Re-read the current Google Maps Service Terms (Places section) and confirm §5.4 still holds. If a browser tool is available, look at the-cafelist.com/nyc and add 3–5 notes on it to `RESEARCH.md`.
✅ The repo is on GitHub, CI is green on an empty app, and keys are verified.

**M1: Data (the most important milestone)**
Run §5.1–5.3.
✅ ~120 spots validated, ≥25 group-friendly, ≥30 free public spaces, both languages complete, 0 closed businesses shown, and a coverage report in `BUILD_LOG.md` (counts by category, borough, and confidence).
- **Confidence metric:** over all spots × the 11 core attributes (10 work attributes plus hours), with unknowns counted in the denominator.
- **Targets:** ≥ 55% at medium or high; wifi, laptopPolicy, and hours known for ≥ 80% of spots.
- **If short of target:** log the shortfall and proceed to M2 anyway. Gaps become the list for Lexi's H8 pass and the "help us fill this in" correction prompts. **Never** fill gaps with guesses to hit the number.

**M2: Map MVP, the shareable static version**
Home, filters, spot pages, i18n, Work Score, the About page draft, and a Vercel deploy (H6).
✅ The deployed URL works on a phone in EN and 中文, filters are reflected in the URL, the list view works with the map disabled, OG images render (test with a link-preview checker), and Lighthouse is ≥ 90.

**M3: Social layer**
Google sign-in (H5b), profiles, check-ins, sessions, RSVPs, reports, submissions, corrections, admin, and the refresh-places workflow.
✅ The E2E social flow passes, RLS is verified (anon users cannot select names; test with the anon key from a script), auto-hide works, the weekly refresh Action runs green once (trigger it manually), and the admin can verify a spot without a deploy. The privacy page is live at `/en/privacy` and `/zh/privacy` (both return 200, covered by a Playwright test in CI), and it is linked from the site footer and the sign-in screen. Don't report M3 done without it.

**M4: Polish & launch kit**
- Final About page and privacy page.
- Analytics.
- **XHS share card:** "Share" on spot and session pages generates a 3:4 (1080×1440) PNG in the current locale with name, neighborhood, Work Score, top attributes, and site URL, ready to post to 小红书.
- Optional domain (H7) and Lexi's verification pass (H8).
- Launch copy (§12).
✅ Everything in §10 passes, and the launch copy is in `launch/`.

**Launch recommendation:** Post in Next Play only after M3, since the social layer is the hook. Before posting, Lexi creates 2–3 real sessions so the page isn't empty on day one.

---

## 12. Launch kit (Claude Code drafts into `launch/`; Lexi edits and posts)
- `slack-next-play.md`: reply in the original thread plus a channel post. Credit the person who asked, give the one-line pitch, the link, an invite to "the first Colo session," and the AI-built angle in one sentence. Casual and short.
- `twitter-thread.md`: a 5–7 post thread. Hook → problem → what's different (colocate, honest data, beyond cafes) → how it was AI-built (numbers from `BUILD_LOG.md`: hours, spots, sources) → link → call for spot suggestions. Include alt text for 3 screenshots.
- `xiaohongshu.md`: a title (≤20 字, with emoji) and body in a native 小红书 voice ("纽约打工人/留学生办公地图" angle), 5–8 hashtags (#纽约生活 #纽约咖啡馆 #远程办公 …), and a 6–9 image carousel plan using the 3:4 share cards.
- `portfolio-blurb.md`: a 3-sentence case study for LinkedIn/portfolio (problem → build → outcome metrics placeholder).

---

## 13. Open decisions (defaults apply unless Lexi overrides)
| Decision | Default |
|---|---|
| Name / domain | "Colo NYC" / 纽约同城办公地图 on vercel.app. Alternatives to offer Lexi at M4: *Laptop Hours NYC*, *Work Here NYC*, *Side by Side NYC* |
| Gate social features to Next Play? | No. Open to everyone, with a self-declared "Next Play" tag and filter |
| Credit the original asker by name | Don't. Launch drafts phrase the origin generically ("Someone in Next Play asked…") |
| Queens beyond LIC/Astoria | No for v1 |
| Paid coworking | Excluded; one "If you need a desk: Croissant / Deskpass" line on About |
