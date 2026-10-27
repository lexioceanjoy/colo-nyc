# Fill pass 06 notes (2026-10-27)

WebSearch worked for this whole pass (about 30 queries, no limit reported). Direct fetches came from curl or WebFetch. Toast (403), tryperdiem review pages (404) and brooklynbridgeparents.com (307 loop) all failed. Scope: hours, wifi and laptopPolicy only. 7 of 22 records changed. 6 attributes went unknown→known and 2 confidences were raised. No closures.

## Changed
- **think-coffee-tribeca**: hours unknown→Mon–Fri 6:30–18:00, Sat–Sun 8:00–18:00 (high, official locations page; it loads fine over curl now). laptopPolicy medium→high, adding Think's own description ("well-suited for focused work"). Added a closing-time gotcha. Source: https://www.thinkcoffee.com/pages/locations
- **birdee-williamsburg**: hours unknown→8:00–16:00 daily (low). Time Out (Apr 11 2025) and Secret NYC (May 2 2025) agree, but both are opening-period coverage, and an Atly search snippet shows 8–6. Gotcha #1 updated. Sources: https://www.timeout.com/newyork/news/an-eleven-madison-park-alum-has-opened-an-all-day-cafe-in-williamsburg-041125, https://secretnyc.co/birdee-cafe-bakery-nyc/
- **moxy-brooklyn-williamsburg**: hours unknown→7:00–00:00 daily (high). These are the hours of Bar Bedford, the lobby bar (Marriott official, and ResortPass agrees). laptopPolicy medium→high, because Marriott calls Bar Bedford "a destination for coffee and co-working by day". Gotcha #2 updated. Sources: https://www.marriott.com/en-us/hotels/nycxb-moxy-brooklyn-williamsburg/dining, https://resortpass.com/hotels/moxy-brooklyn-williamsburg
- **devocion-flatiron**: laptopPolicy unknown→welcome (low). The undated Atly listing for 25 E 20th St is tagged "Work Friendly" and says to arrive at opening if you plan to work remotely. Source: https://www.atly.com/location/Devoción4
- **hungarian-pastry-shop**: laptopPolicy unknown→welcome (medium). theworkingline (Jun 2025) calls it a long-time study spot where you can settle in for hours, and Columbia Magazine (Fall 2021, older) describes students there on laptops. The official site says patrons can "sit as long as they like".
- **the-chipped-cup-hamilton-heights**: laptopPolicy unknown→welcome (medium). theworkingline (Jun 2025) says the back garden is "perfect for freelancers working on their laptops".
- **williamsburgh-library**: laptopPolicy unknown→welcome (medium). The BPL Wi-Fi page offers free wireless access to laptop users at all branches, the same basis used for bedford-library and pacific-library. Source: https://www.bklynlibrary.org/use-the-library/wi-fi

## Checked, no change
- kos-kaffe-park-slope wifi: the only source is Atly (https://www.atly.com/location/KosKaffe, undated), and it contradicts itself ("strong wifi" vs "Wi-Fi is extremely poor and may not work at all"). Left as unknown.
- madame-bonte-yorkville wifi: nothing found. A ma.to FAQ says laptops are allowed "at the bar area only", but that page covers all 3 UES locations plus the 84th St wine bar, so I didn't apply it to 1834 2nd Ave. The existing weekdays_only value stays.
- verse-cafe-astoria hours: joe.coffee and directory listings still conflict, so hours stay unknown. Atly reviewer: "people hog tables with laptops".
- variety-coffee-greenpoint hours: the official page has no hours. The June 2026 "new Greenpoint" Variety (7am–9pm, per whatnow.com) is a different shop at 190 Franklin St, not 142 Driggs. Possible new record candidate.
- greats-of-craft-lic: joe.coffee shows Thu–Sun only and QNS 2024 shows daily from 7:30, so hours stay unknown. No Wi-Fi mention found.
- qahwah-house-astoria: only directory hours (Zabihah 7am–12am, 1am Fri–Sat; Frankiapp differs). The official locations page has no hours for Astoria. No Wi-Fi or laptop info found.
- stone-street-coffee-soho: no Soho hours anywhere. The per-diem ordering site (Broome St.) has no hours, and the 8–5 hours online belong to the Southold cafe. No laptop policy found. It still appears to be operating (the ordering site is live).
- now-or-never-coffee-soho: no public hours. Giggster's 4–9pm is for venue rental.
- avabrew-downtown-brooklyn: the Wi-Fi evidence is a 2016 Brooklyn Paper article (too old). The only hours source is a single-day directory snapshot.
- absolute-coffee-boerum-hill: directory hours conflict (Frankiapp vs whereyoueat).
- capital-one-cafe-59th-lexington: the official page still shows only branch-service hours. Third-party café hours disagree.
- kimpton-hotel-eventi: no published lobby or Living Room hours.
- 550-madison-garden, citigroup-center-atrium, park-avenue-plaza-atrium: no source mentions Wi-Fi or laptop use.

## Closures
None found.
