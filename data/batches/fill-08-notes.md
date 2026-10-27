# Fill pass 08 notes (2026-10-27)

This pass covered hours first, then wifi. WebSearch worked for the whole pass (about 22 queries, no limit message). Venue sites were read with plain curl or WebFetch. I skipped sources earlier passes found blocked (nypl.org, instagram, toasttab, workfrom.co). drinkmorning.com returned 429 and blog.dearsundays.com returned 500; I didn't retry either. stonefruitespresso.com is a Square Online JS shell with no readable hours.

5 of 16 records changed. 8 attributes went from unknown to known (4 hours, 4 wifi). No closures found.

## Changed
- **ole-and-steen-union-square** · hours unknown→Mon–Sat 7:00–19:00, Sun 8:00–19:00 (medium). The source is the official store page's embedded schedule, which includes dated entries for Oct 20–29, 2026. The brand's Union Square landing page says weekends open at 8am, so Saturday opening is noted as possibly varying. Gotcha updated. Wi-Fi is still unknown: the only free-Wi-Fi mention (Infatuation) is for the Midtown East branch. Sources: https://oleandsteen.us/store/132020-union-square , https://oleandsteen.us/local-bakery-at-union-square
- **nypl-53rd-street-library** · hours unknown→Mon–Sat 11–18, closed Sun (medium). wifi unknown→ok (medium). The hours come from a WebSearch snippet of the official NYPL page, which I couldn't open because nypl.org blocks fetches. The Wi-Fi value comes from NYPL help-page snippets ("free wireless at all locations", open "NYPL" network). Gotchas updated. Sources: https://www.nypl.org/locations/53rd-street , https://www.nypl.org/help/computers-internet-and-wireless-access , https://www.nypl.org/get-help
- **nypl-washington-heights** · hours unknown→Mon–Thu 10–19, Fri–Sat 10–17, Sun 13–17 (medium). wifi unknown→ok (medium). Same snippet caveat. An older legacy NYPL page shows shorter hours, which is noted on the record. Source: https://www.nypl.org/locations/washington-heights plus the NYPL Wi-Fi pages above.
- **inwood-library** · hours unknown→Mon–Thu 10–19, Fri–Sat 10–17, closed Sun (low). wifi unknown→ok (medium). The full schedule appeared only in the snippet of an NYPL mirror page (globallib.nypl.org); the main-page snippet showed only "today 10–7". An older directory lists Sunday 1–5pm. Sources: https://www.nypl.org/locations/inwood , https://globallib.nypl.org/locations/inwood
- **kos-kaffe-park-slope** · wifi unknown→ok (low). The official site has a "Wifi Policy" section, which confirms Wi-Fi exists, but gives no speed. The existing gotcha about lunch-rush Wi-Fi restrictions stays. Source: https://www.koskaffe.com/

## Checked, no change
- absolute-coffee-boerum-hill: the only hours are on directories (whereyoueat 7–7:45; frankiapp 7–6, which may describe a Bleecker St shop). No official site was found.
- cafe-flor-chelsea: no full schedule. Time Out (2022) says Bar-21 opens daily at 2pm, which is old. The IG appears only through a scraper mirror, which I didn't use.
- coppola-cafe-west-village: the only hours are directories (Sideways, whereyoueat: 7:15–18:30 weekdays).
- ground-support-soho: directories still conflict (3pm, 6pm, 8pm closes), and the official site has no hours.
- lincoln-station-prospect-heights: Half Half (Sept 2026) still says only "open til 9 pm". Its Wi-Fi is mentioned only in an undated workfrom snippet (blocked site), so it stays unknown.
- moxy-nyc-downtown-recreation: downtownny.com (Oct 2021) has no hours or Wi-Fi details. No official lobby hours found.
- stonefruit-espresso-bed-stuy: the site is a JS shell. One directory snapshot shows Sunday 11–9 only.
- urban-garden-room-one-bryant-park: only audiala.com (unofficial, uncited) gives weekdays 8–6 plus Wi-Fi. Durst and Bryant Park pages list no room hours.
- variety-coffee-upper-east-side: the official locations page gives the address but no hours. Undated guide snippets say 7am–9pm, but they conflict on Sunday and the source page returned 429.
- 875-third-avenue-atrium, sit-and-wonder-prospect-heights: no Wi-Fi source found. Sit & Wonder hours are still the 2010 Time Out listing.

## Closures
None found.
