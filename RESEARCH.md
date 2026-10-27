# Market scan: NYC work & colocating spots

Researched Oct 26, 2026. Purpose: find the gap a fast, AI-built NYC map can own.

## TL;DR

The space is crowded with **static cafe directories** and **paid desk-booking apps**. Nobody combines (a) trustworthy, explained "workability" data across cafes *and* free public spaces with (b) a way for people to actually **find each other and work side by side**. That social/colocating layer is the wedge, and it's also what makes this a networking piece rather than another list.

## Landscape

### 1. Direct competitors: NYC work-cafe maps/lists

| Product | What it is | Strengths | Weaknesses / gap |
|---|---|---|---|
| **The Cafe List** (nyccafelist.com → the-cafelist.com/nyc) | A founder's viral X list turned into a site within 2 days (2026): map, community reviews, WiFi passwords, neighborhood filters, ratings for coffee / vibes / workability. Now multi-city. | Closest analog, with proven demand and a viral origin story. Community reviews. | Cafes only. No public spaces or group seating. No "who's here" or colocating. JS-only page (poor SEO and link previews). **Must be reviewed by hand in a browser before building (M0).** |
| **Half Half Travel NYC Cafe Map** | Blogger's interactive map of 44 Manhattan/Brooklyn laptop cafes with neighborhood filters and saved favorites. | Clean, filterable. | Email signup wall. No update date. Fewer spots than its own guides (29 + 37). |
| **Savour by Shortlist** (45 laptop-friendly cafes) | Newsletter listicle covering seating, noise, WiFi, outlets. Includes Queens. | Editorial voice; updated Feb 2026. | Article format with no map. "WiFi: Yes" for every spot, so the field tells you nothing. |
| **Freaking Nomads** (NYC cafes) | Global nomad directory with download speed, outlet level, and noise filters. | Speed-test numbers. | Upload speed "Unknown" everywhere and noise mostly "Moderate", so the data is thin. No dates. |
| **Roasters app** (WiFi & laptops guide) | 401 NYC specialty cafes, app-backed. | Big inventory. | A coffee app, not a work app: spots are unvetted and the data stays inside the app. |
| **Laptop Friendly** (laptopfriendly.co) | Global community map of cafes, restaurants, hotel lobbies. About 369 NYC listings. | Deepest free NYC inventory; includes hotel lobbies; "best times to work." | Generic global UX with no local curation or community. |

### 2. Adjacent: generic work-spot apps

- **Workfrom**: the original "places to work" community app. Largely dormant, which shows community-sourced data decays without a local core.
- **Co-Fi Map, Cafés To Work From, FreeWork, Knowmad, Remo (Indie Hackers beta, Jul 2026)**: indie apps with filters for WiFi, power, and quiet. None have real NYC depth. *Cafés To Work From* sells a $4.99 "Cowork" subscription to host/join cafe sessions, which shows the social idea has been tried but in an app with no local density.
- **Indie Hackers thesis (Remo)**: "Google Maps was built to help people find places to eat," not to work. The top reply names the real problem: **trust + freshness + local density**, not discovery.

### 3. Adjacent: paid desks

- **Croissant** (about 52 bookable NYC spaces; $49/mo for 10 hrs), **Deskpass**, **WeWork All Access**, **Coworker.com**. They have real inventory and solve paid desks well. Excluded from v1 by decision; can be linked out later.

### 4. Adjacent: free public space data

- **NYC Public Space app** (Chris Whong, 2025): about 2,800 parks, plazas, and POPS from open data, with seating/table/restroom fields and AI descriptions. Its weaknesses are wrong AI descriptions and one-person moderation. **Lesson: label AI-generated content and show confidence.**
- NYC POPS open data, library branches (NYPL / BPL / QPL), museum cafes, hotel lobbies: only scattered blog lists (Built In "5 free places to work") cover these together with cafes.

### 5. Adjacent: people working together

- Meetup "New York Coworking Friends", foundercal / GarysGuide / vibecal event calendars, betaworks events. Cowork days do happen, but they are scattered across event platforms and **not tied to a map of good spots**.

### 6. Distribution signals

- **NYC Vibe Directory** (Tech:NYC + @obviously_nyc, 2026) catalogs vibe-coded NYC projects. It's an extra launch channel; Lexi should find the submit link in a browser (the X post couldn't be read automatically).
- The Cafe List went from tweet to product in 2 days and got picked up by @newyorklocals. Speed plus a personal origin story travels.

## Where to win

1. **Colocating, not just locating.** "I'm here today" check-ins and hosted cowork sessions. No NYC competitor has this. It is the networking hook for Next Play.
2. **Beyond cafes.** Free public spaces (libraries, POPS, hotel lobbies) plus a **group-friendly** flag (fits 3–8 people). That answers the original Slack ask ("coworking and colocating") better than a cafe list.
3. **Honest, explained data.** Every attribute shows its source, confidence, and last-checked date, with an "AI-researched" vs "Verified" badge. This turns the competitors' main weakness (stale, unexplained data) into the portfolio story: *"AI-built, and it tells you how sure it is."*
4. **Work-specific gotchas competitors skip:** weekend laptop bans, time limits, purchase-required, laptop-free zones, and when it gets crowded.
5. **Bilingual EN / 中文.** Nobody serves the NYC Chinese-speaking remote-work crowd. It makes the Xiaohongshu post land natively.

## Risks

- **Density:** a social layer is empty without users. Mitigation: launch inside Next Play with seeded sessions (Lexi hosts the first 2–3), and make the map useful with zero check-ins.
- **Freshness:** data decays. Mitigation: a scheduled refresh of Google data, a "report outdated info" button, and last-checked dates shown.
- **Google ToS:** Places data must be shown on a Google map and cached for no more than 30 days. This is designed into the spec.
- **Safety/privacy:** names at a physical location. Check-ins are opt-in, expire the same day, and names are visible only to signed-in users.

## Sources

- [The Cafe List launch (Threads @newyorklocals)](https://www.threads.com/@newyorklocals/post/DYVdRm5Fgzh) · [the-cafelist.com/nyc](https://the-cafelist.com/nyc)
- [Half Half Travel NYC cafe map](https://www.halfhalftravel.com/tools/nyc-cafe-map/) · [Manhattan guide](https://halfhalftravel.com/travel-guides/laptop-friendly-cafes-in-manhattan.html)
- [Savour by Shortlist: 45 laptop-friendly cafes](https://shortlistnyc.beehiiv.com/p/cafes)
- [Freaking Nomads NYC](https://freakingnomads.com/workspaces/cafe/new-york-city)
- [Roasters WiFi & laptops NYC](https://roasters.app/guides/new-york-ny-us/wifi)
- [Laptop Friendly alternatives](https://alternativeto.net/software/laptop-friendly) · [Workfrom alternatives](https://alternativeto.net/software/workfrom)
- [Co-Fi Map](https://apps.apple.com/us/app/-/id6526489193) · [Cafés To Work From](https://apps.apple.com/app/id6745089649) · [FreeWork](https://apps.apple.com/us/app/freework/id6754230751) · [Knowmad](https://apps.apple.com/app/id6778948147)
- [Indie Hackers: why is finding a work-friendly café still so hard](https://www.indiehackers.com/post/why-is-finding-a-work-friendly-caf-still-so-hard-adbd7ae7bc)
- [Croissant: Deskpass overview](https://www.getcroissant.com/resources/workspace-index/platforms/deskpass) · [Built In NYC on Croissant](https://www.builtinnyc.com/articles/croissant-classpass-coworking)
- [Reboot Democracy: NYC Public Space app](https://rebootdemocracy.ai/blog/vibe-coding-the-city-how-one-developer-used-open-data-to-map-every-public-space-in-new-york-city)
- [Wikipedia: NYC POPS](https://en.wikipedia.org/wiki/List_of_privately_owned_public_spaces_in_New_York_City) · [Built In: 5 free places to work in Manhattan](https://builtin.com/articles/cant-afford-wework-here-are-5-free-places-work-manhattan)
- [Meetup: New York Coworking Friends](https://www.meetup.com/new-york-coworking-friends/) · [foundercal NYC](https://foundercal.com/cities/nyc)
- [Tech:NYC: NYC Vibe Directory](https://x.com/TechNYC/status/2069503387734032850)
- [Next Play (Ben Lang) Substack](https://nextplayso.substack.com/p/community-roundup)
- [Google Maps Platform service terms (Jun 2026 archive)](https://cloud.google.com/archive/maps-platform/terms/maps-service-terms-20260610) · [Pricing categories](https://developers.google.com/maps/billing-and-pricing/pricing-categories)

## M0 hands-on notes: the-cafelist.com/nyc (viewed in Chrome, 2026-10-27)

- **Shape:** landing view with MAP / GRID / SAVED tabs and a sign-in. Every spot gets a single score out of 10 ("Conwell Coffee Hall / 8.4 / FiDi"). No breakdown or source is shown at the list level, so we win on *explained* scores.
- **Scope is wider than "cafes":** featured spots include PUBLIC Hotel (lobby) and Intelligentsia (High Line Hotel). It's still cafe-led, with no libraries, POPS or a group filter.
- **Thin server-rendered page:** only ~300 characters of text in the DOM at load (hero plus five featured names). The full list loads client-side, so it is weak for SEO and link previews. Our SSR list plus per-spot OG images still matter.
- **Overlap check:** Conwell Coffee Hall, PUBLIC Hotel and Felix Roasting Co. are also in our candidate set. Their scores are a useful sanity check, but we don't copy them (our score is our own formula).
- **No social layer visible** ("who's here", sessions). This confirms the wedge.

## M0: Google Maps terms re-check (2026-10-27)

Current Service Specific Terms are "Last modified October 15, 2026" (newer than the June 2026 version the spec cites). For the Places API (Legacy and New), §14.2: "Customer must not use Google Maps Content from the Places API in conjunction with a non-Google map." §14.3: lat/lng may be cached "for up to 30 consecutive calendar days". The Places API policies page (updated 2026-10-23) says place IDs "are exempt from the caching restrictions" and may be stored indefinitely. **SPEC §5.4 still holds unchanged.**
