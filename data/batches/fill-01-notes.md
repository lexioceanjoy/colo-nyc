# Gap-fill pass 01 (2026-10-27)

WebSearch budget ran out after 1 query, so this pass relied on direct fetches. Shopify-hosted venue sites (groundcentral.com, seycoffee.com, varietycoffeeroasters.com, stonestreetcoffee.com, hexnyc.com) returned HTTP 429. I did not retry them more than once.

## Updated (9 records)
- **lions-milk-williamsburg**: wifi unknown→ok (low). laptopPolicy welcome→weekdays_only (low), with a conflict note: Half Half Travel (Sept 2026) says laptop-friendly and doesn't mention weekends; Metropolis Moving (Jul 2024) says weekends are laptop-free. Gotchas updated. Hours rechecked on lionsmilkbk.com and they match. Sources: https://metropolismoving.com/blog/top-15-places-to-remote-work-in-williamsburg/ , https://www.halfhalftravel.com/travel-guides/laptop-friendly-cafes-brooklyn-nyc.html
- **rhythm-zero-greenpoint**: callsOk unknown→true (medium). The guide mentions dialing into a meeting. Hours rechecked on rhythmzeronyc.com and they match. Source: Half Half Travel Brooklyn.
- **citigroup-center-atrium**: groupCapacity unknown→4-6 (low), based on the required movable tables and chairs (APOPS, Mar 2023). Source: https://apops.mas.org/pops/m060032/
- **avabrew-downtown-brooklyn**: added busyTimes ("rarely so crowded you won't get a seat"). Source: Half Half Travel Brooklyn.
- **hungarian-pastry-shop**: timeLimitMin null raised medium→high (official site plus West Side Rag Nov 2025). Hours rechecked on the official site and they match.
- **kona-coffee-east-village**: wifi unknown→ok (medium); weekend limit kept in the note. Sources: theworkingline (Jun 2025), NYU News (Mar 2025).
- **cafe-flor-chelsea**: wifi unknown→ok (medium). Sources: Half Half Travel Manhattan (Sept 2026), theworkingline (Jun 2025).
- **ground-central-hells-kitchen**: noise unknown→quiet (medium). Sources: theworkingline ("calm but productive"), Half Half Travel (library-like couches).
- **picky-barista-columbus-ave**: hours confidence medium→high, from the official site (pickybarista.com: Mon–Fri 7–7, Sat–Sun 8–7).

## Checked, no change
- hex-and-co-morningside-heights: no official hours were reachable (site gave 429/SSL errors). West Side Rag only confirms that daytime tables are free of gamers, which the existing gotcha already covers.
- birdee-williamsburg: Infatuation review (Apr 2025) adds nothing on wifi, outlets or hours. The Refinery site failed SSL.
- bibliotheque-soho: official site confirms the hours and the 10am–5pm laptop window, which are already recorded.
- greats-of-craft-lic: official site and locations page list no hours or wifi.
- mushtari-cafe-harlem, cafe-miguel-williamsburg, ground-support-soho, stone-street-coffee-soho, sey-coffee-bushwick, ace-hotel-new-york, capital-one-cafe-59th-lexington: nothing new from their sites or reviews. Ground Support hours: the only listings were directories and they conflicted, so I left hours unknown.
- qahwah-house-astoria: official locations page has no hours. busyTimes already matches atly.
- the-hoxton-williamsburg: official page confirms fast free wifi (already recorded) but lists no lobby or cafe hours.
- marlton-hotel-greenwich-village: the only posted hours are for Chez Nous (7am–11pm daily), the restaurant, not the lobby, so I didn't use them.
- 590-madison-atrium, winter-garden-brookfield-place: APOPS and the bfplny FAQ confirm the existing values. 590 Madison: users note a guard said moving tables is against the rules, and there's no AC in summer.
- sunset-park-library, broadway-library-astoria: library pages confirm the hours already recorded. Neither page mentions seating, noise or calls.
- the-lost-draft-nolita: Half Half Travel says "open til 9pm most days", which isn't enough for structured hours. The official site lists none.
- variety-coffee-chelsea: busyTimes is already recorded. The site returned 429.

## Closures
None found.
