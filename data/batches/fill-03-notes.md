# Fill pass 03 notes (2026-10-27)

WebSearch budget ran out partway through, so most of this pass came from fetching pages directly. Several Shopify cafe sites returned 429 errors to WebFetch but loaded fine over plain curl.

## Changed (13 records, 14 attributes unknown→known, 1 confidence lowered)
- brooklyn-roasting-company-flushing-ave · hours unknown→Mon–Fri 6am–7pm, Sat–Sun 7am–7pm (high). Replaced the "hours unconfirmed" gotcha. Source: https://brooklynroasting.com/pages/our-stores
- hunters-point-library-lic · wifi unknown→ok (medium). QPL Extended Wi-Fi, no sign-in needed. Source: https://www.queenslibrary.org/about-us/locations/hunters-point
- pacific-library · wifi unknown→ok (low) and laptopPolicy unknown→welcome (medium), using the same basis as bedford-library. Source: https://www.bklynlibrary.org/use-the-library/wi-fi. The branch page doesn't mention seating, outlets or noise.
- devocion-downtown-brooklyn · wifi unknown→ok (medium). Free and password-protected, switched off on weekends. Source: https://www.halfhalftravel.com/travel-guides/laptop-friendly-cafes-brooklyn-nyc.html (updated 2026-09-20)
- irving-farm-washington-square · wifi unknown→none (low). The guide says none of the Irving Farm locations have Wi-Fi, but it doesn't review this branch. Updated gotcha #1. Source: https://www.halfhalftravel.com/travel-guides/laptop-friendly-cafes-in-manhattan.html. Official hours re-confirmed (unchanged): https://irvingfarmcoffee.com/pages/washington-square
- sweetleaf-long-island-city · wifi unknown→ok (low) and restroom unknown→customers (low). The ATLY listing (updated Oct 2026) names "Sweetleaf Coffee Roasters" without an address, which is why confidence is low. Source: https://www.atly.com/united-states/new-york/new-york/long-island-city/best-coffee-work-friendly. Official hours re-confirmed: https://www.sweetleafcoffee.com/pages/jackson-avenue
- verse-cafe-astoria · timeLimitMin unknown→null (low). A customer review says they wish there were a time limit. Rewrote gotchas: Saturday waits, and conflicting third-party hours (Joe lists Tuesday as closed, ATLY lists 7–6 daily), so hours stay unknown. Source: https://joe.coffee/locations/ny/long-island-city/verse-long-island-city
- high-line-hotel-chelsea · callsOk unknown→true (low). An undated guide says the lobby nooks suit online meetings. Source: https://www.blacklane.com/en/blog/travel/hotels/manhattan-hotel-lobbies-that-double-as-creative-work-spaces
- david-rubenstein-atrium-lincoln-center · seating stays "plenty" but confidence high→low. The APOPS rules require 152 chairs, while the official page now says "Limited seating ... first come, first served". Source added: https://www.lincolncenter.org/venue/atrium/v/about
- moxy-nyc-downtown-recreation · laptopPolicy unknown→welcome (low). Sources are a 2021 article and a 2023 WFH review. Hours stay unknown because the 2018 hours (6:30am–2am) and a partial Tripleseat listing conflict. Sources: https://wfhishnyc.substack.com/p/review-recreation-at-moxy-hotel-downtown, https://downtownny.com/news/the-hotel-bar-thats-great-for-pretending-youre-at-work-is-back/
- now-or-never-coffee-soho · laptopPolicy unknown→welcome (medium). Sources: https://www.halfhalftravel.com/travel-guides/laptop-friendly-cafes-in-manhattan.html, https://wfhishnyc.substack.com/p/review-now-or-never-cafe
- conwell-coffee-hall-fidi · bookableSpace unknown→false (medium). Daytime seating is first come, first served; only evening tables take Resy bookings. Source: https://conwellhall.com/ (hours unchanged)
- dots-cafe-hells-kitchen · bookableSpace unknown→false (high). The site says "we do not take reservations". Source: https://www.dotscafenyc.com/

## Checked, no change
- whole-foods-union-square: the store page lists only "Café Seating" plus hours (7am–10pm, already known). It says nothing about Wi-Fi, restrooms or laptops.
- manhattanville-coffee-harlem-collective: the only hours found are from Oct 2022 (Tue–Fri 7am–4pm, Sat–Sun 8am–4pm, "longer hours coming soon"). That's too old and likely changed, so hours stay unknown. The official site renders no content.
- 1-hotel-brooklyn-bridge, kimpton-hotel-eventi, arlo-soho-hudson-square: the hotel sites and guides only repeated what the records already say. Eventi hours aren't published.
- partners-coffee-long-island-city: the official locations page lists the address only, with no hours.
- variety-coffee-greenpoint, variety-coffee-upper-east-side: the official locations page has no hours.
- the-bean-east-village-2nd-ave: hours conflict (7am–midnight vs 7am–9pm from 2020), and thebeannyc.com returned 403, so I didn't fetch it further.
- coppola-cafe-west-village: only third-party directory hours were found, so I didn't use them.
- 875-third-avenue-atrium, bedford-library, devocion-flatiron, overflow-coffee-long-island-city, sweetleaf-greenpoint: nothing new beyond the current record (official hours re-confirmed where available).

## Closures
None found.
