# Colo NYC · 纽约同城办公地图

The best places in NYC to work, and to work *together*. A bilingual (EN / 中文) map of laptop-friendly cafes, libraries, public atriums and hotel lobbies, with honest, sourced data and a social layer ("I'm here today", hosted cowork sessions).

- Every work attribute shows its **source, confidence and last-checked date**. Unknown stays unknown.
- The **Work Score** (0–10) is always shown with its breakdown.
- Built end to end with Claude Code. See `BUILD_LOG.md`, `DECISIONS.md` and the About page.

## Develop
```bash
pnpm install
cp .env.example .env.local   # fill in; see docs/SETUP-M0.md
pnpm dev                     # http://localhost:3000
pnpm lint && pnpm typecheck && pnpm test && pnpm validate && pnpm build   # quality gate
pnpm e2e
```

## Data
- `src/data/spots.json`: curated spots (our own research; zod schema in `src/lib/schema.ts`)
- `data/candidates.csv`, `data/excluded.csv`, `data/batches/*`: research trail
- Google data: only **place IDs** (repo) and **lat/lng** (Supabase `place_geo`, ≤ 30 days). See SPEC §5.4.
- `pnpm data:resolve` / `pnpm data:fetch`: Places API (prints a cost estimate first; capped at 1,000 calls per run)
- `pnpm data:report`: coverage report
- `pnpm data:osm`: import OpenStreetMap tags (opening_hours, internet_access, power_supply) for unknown details

### Data credits & license
Some values in `src/data/spots.json` are derived from OpenStreetMap (© OpenStreetMap contributors, [ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/)); each such value cites its OSM object URL.

See `SPEC.md` for the full product spec.
