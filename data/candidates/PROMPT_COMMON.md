# Candidate collection: shared instructions (Colo NYC)

You are collecting CANDIDATE spots for "Colo NYC", a bilingual map of the best places in NYC to work on a laptop and to work *together* (groups). Geography: Manhattan, Brooklyn, and Long Island City / Astoria (Queens) ONLY.

Rules (non-negotiable):
- Never invent facts. Every candidate must come from at least one real source URL that you actually saw (in a web search result or a fetched page). If you can't cite it, drop it.
- Google Maps is NOT a source. Do not copy reviews.
- EXCLUDE paid day-pass coworking (WeWork, Industrious, Croissant, Deskpass, etc.).
- EXCLUDE anything with a reported permanent closure (search "<name> closed" when in doubt; many 2022-2024 listicle cafes have closed). Put those in the excluded file with reason.
- Cafes with a clear "no laptops ever" policy go to the excluded file with reason (this list is content for the site; it's valuable — capture several if you find them).
- Instagram/Reddit/Yelp often block fetching: use their snippets from search results; only cite URLs you could read or whose snippet you saw.
- Prefer sources from the last ~18 months (2025-2026). Today is 2026-10-27.

Output: write TWO CSV files (RFC 4180, quote any field containing commas/quotes) to the paths given in your task:
1. candidates CSV with header exactly:
   name,category,borough,neighborhood_guess,address_hint,source_urls,why_included
   - category ∈ cafe | library | pops | hotel_lobby | museum | other_public
   - borough ∈ manhattan | brooklyn | queens
   - source_urls: pipe-separated (|) URLs
   - why_included: ≤25 words: what makes it good to work from; mention "group" if 4+ people can sit together.
2. excluded CSV with header exactly:
   name,borough,reason,source_urls

Finish with a 3-line summary: counts written, notable exclusions, anything you couldn't verify.
