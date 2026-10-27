# Fill pass 05 notes (2026-10-27)

This pass covered only hours, wifi and laptopPolicy. WebSearch worked for the whole pass (about 25 queries) and never reported a limit, but it mostly returned aggregator listings and pre-2020 coverage. Venue sites were read with plain curl. I skipped sources earlier passes found blocked (nypl.org, instagram, thebeannyc.com, workfrom.co, Shopify 429s on WebFetch). 4 of 22 records were updated, 5 attributes went from unknown to known, and no closures were found.

## Updated
- **hex-and-co-morningside-heights**: hours unknown→Mon–Thu 8am–11pm, Fri–Sat 9am–midnight, Sun 9am–11pm (high, official). wifi unknown→ok (medium). laptopPolicy unknown→weekdays_only (medium). The official banner says "Complementary Seating and Wifi with any Café purchase from Open-5pm Every Weekday" and excludes gameplay. Gotchas rewritten. Source: https://hexnyc.com/ (fetched with curl; it gave 429 to WebFetch in earlier passes)
- **fontainhas-dumbo**: wifi unknown→ok (medium). ATLY (updated Oct 2026) says "Spacious seating with WiFi". The Infatuation's "coffee shops with wifi" guide (updated Sep 2026) also lists it. Hours stay unknown because ATLY gives only "open at 7:30 AM" with no closing time (noted in gotcha). Sources: https://atly.com/best/work_friendly-dumbo-new-york-city-new-york-united-states , https://www.theinfatuation.com/new-york/guides/coffee-shops-nyc-for-doing-work
- **ludlow-hotel-lower-east-side**: wifi unknown→ok (low). Time Out (Jul 2019): "Locals and guests are invited to use the Wi-Fi". It is old, so confidence is low. Source: https://www.timeout.com/newyork/hotels/best-hotel-lobbies-with-free-wi-fi
- **arlo-nomad**: hours unknown→daily 7am–2pm (medium). These are the official hours of the lobby NoMad Bodega's barista counter. Grab-and-go is sold 24/7, but whether non-guests can use the lobby outside those hours is unconfirmed (see note). Gotcha added. Source: https://arlohotels.com/nomad/eat-and-drink/nomad-bodega/

## Checked, no change
- **ole-and-steen-union-square**: oleandsteen.us is a JS shell with no hours. Search found only amNY 2019 (6:30am–10pm weekdays) and an undated Travelsort review (8am–9pm daily). These conflict and are stale.
- **variety-coffee-chelsea / variety-coffee-upper-east-side**: the official locations page lists addresses only. Hours come only from directories (Caffeatlas, Shopkeepers: 7am–9pm, undated) and Hoodline 2018. Not used, matching the policy in earlier passes.
- **the-lost-draft-nolita**: the official site has no hours. Half Half says "til 9pm most days" and Caffeatlas says it closes at 19:00. They conflict.
- **the-bean-east-village-2nd-ave**: EV Grieve (Aug 6, 2026, https://evgrieve.com/2026/08/another-location-of-bean-closes-leaving.html) says 54 Second Ave is now the last East Village Bean. It is still open, but the post never published the promised new hours. Hours stay unknown.
- **cafe-flor-chelsea**: no full schedule found. A Wanderlog snippet mentions "laptop-free hours weekly" without specifics. I didn't use it (aggregator, unverifiable). Worth a manual check.
- **capital-one-cafe-union-square**: the official page is JS-rendered and its café hours are still not posted. Search results only gave other branches' hours.
- **kona-coffee-grand-central**: only a directory listing ties Kona Coffee Roasters to 100 Park Ave. No hours and no proof it is still open.
- **mushtari-cafe-harlem**: the Infatuation review (Feb 2025) re-confirms wifi ("there's wifi too") but is from the same publisher as the existing source, so confidence is unchanged. No hours found.
- **marlton-hotel-greenwich-village**: search surfaced a 2026 hotelsabovepar review describing laptop workers in the lobby, but the URL redirects to the homepage, so I couldn't read it and didn't cite it. Lobby hours: only a 2012 espresso bar listing (7am–6pm).
- **public-hotel-lower-east-side**: OTA listings mention free Wi-Fi in public areas and the lounge/bar from 12pm–4am. That isn't enough for lobby hours, and wifi is already known.
- **david-rubenstein-atrium-lincoln-center**: the official page re-confirms hours (unchanged) and links a Lincoln Center Wi-Fi terms page that isn't atrium-specific. Laptop-use evidence comes only from an undated PPS case study, so laptopPolicy stays unknown. spottedbylocals returned 403.
- **bibliotheque-soho**: the official site re-confirms hours. The Infatuation review (Jan 2024) and helpnewyork (May 2026) confirm the 10am–5pm laptop window but say nothing about Wi-Fi.
- **1-hotel-brooklyn-bridge, 875-third-avenue-atrium, whole-foods-union-square, sit-and-wonder-prospect-heights, irving-farm-washington-square**: no venue-specific wifi or laptop-policy source found. Only OTA "free WiFi for guests" claims, APOPS (no wifi listed), or results about other locations.

## Closures
None found. (EV Grieve, 2026: two other Bean locations closed, at 3rd Ave in May and Broadway/9th in Aug. Neither is in our dataset.)
