# M0 human steps (H1–H5): one checklist

H1 (`gh auth login`) is **already done** (logged in as `lexioceanjoy`). `.env.local` is already created with a random `IP_HASH_SALT`; fill in the blanks below. **Never paste keys into chat.** About 25 minutes total.

## A. Google Cloud project + APIs (H2)
1. Open https://console.cloud.google.com → project picker (top bar) → **New project** → Name `colo-nyc` → **Create**, then select it in the picker.
2. ☰ → **Billing** → **Link a billing account** (create one with a card if prompted).
3. ☰ → **APIs & Services → Library** → search **Maps JavaScript API** → **Enable**. Back to Library → search **Places API (New)** → **Enable**. (Not "Places API" without "(New)".)

## B. Map ID + styles (H2)
4. Go to https://console.cloud.google.com/google/maps-apis → **Map management** → **Create Map ID** → Name `colo-web`, Map type **JavaScript**, rendering **Vector** (leave tilt/rotation off) → **Save**. Copy the Map ID into `.env.local` → `NEXT_PUBLIC_GOOGLE_MAP_ID`.
5. *(Optional, 5 min, makes the markers pop)* **Map Styles** → **Create style**:
   - Choose **Light** (or "Silver"), then in the editor set **Points of interest → Visibility: Off** (keep Transit on) and drag overall **Saturation** down. **Save** as `colo-light`.
   - **Create style** again → choose **Dark** → same POI-off tweak → **Save** as `colo-dark`.
   - Back in **Map management → colo-web** → set **Light mode style = colo-light** and **Dark mode style = colo-dark** → **Save**. If you skip this, the map uses Google's default look.

## C. Two restricted API keys (H3)
6. ☰ → **APIs & Services → Credentials** → **+ Create credentials → API key**. On the key page:
   - Name: `colo-browser`
   - **Application restrictions → Websites** → add `http://localhost:3000/*` and `https://colo-nyc.vercel.app/*` (do **not** add `*.vercel.app`)
   - **API restrictions → Restrict key** → tick only **Maps JavaScript API** → **Save**
   - Copy it into `.env.local` → `NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY`
7. **+ Create credentials → API key** again:
   - Name: `colo-server`
   - **Application restrictions → None** (it runs from GitHub Actions, whose IPs change)
   - **API restrictions → Restrict key** → tick only **Places API (New)** → **Save**
   - Copy it into `.env.local` → `GOOGLE_PLACES_SERVER_KEY`

## D. Cost guardrails (H4)
8. ☰ → **Billing → Budgets & alerts** → **Create budget** → Name `colo`, Scope: project `colo-nyc` → **Next** → Budget type **Specified amount**, `$25` → **Next** → thresholds: **40% (= $10)** and **100% (= $25)**, Actual spend → tick **Email alerts to billing admins and users** → **Finish**.
9. ☰ → **APIs & Services → Enabled APIs & services** → **Maps JavaScript API** → **Quotas & System Limits** tab → find **Map loads per day** → ⋮ / ✏️ **Edit quota** → `600` → **Submit**. (The list view keeps working if the cap is hit.)

## E. Supabase: production + test projects (H5)
10. https://supabase.com/dashboard → **New project** → your org → Name `colo-nyc` → **Database password: Generate** (copy it into `.env.local` → `SUPABASE_DB_PASSWORD`) → Region **East US (North Virginia)** → **Create new project**.
11. When it's ready: **Project Settings → Data API** → copy **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`. Then **Project Settings → API Keys** → copy the **anon / publishable** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY` and the **service_role / secret** key → `SUPABASE_SERVICE_ROLE_KEY`.
12. Repeat 10–11 for a second project named `colo-nyc-test` and put its values in the `SUPABASE_TEST_*` lines. (Free tier allows 2 projects. E2E tests create throwaway users only here, never in production.)

## F. Hand it back
13. In this terminal run `! bash scripts/push-secrets.sh` (it copies the values into GitHub Actions secrets without printing them).
14. Say **"done"**. I'll then run `pnpm env:check` (it test-calls both keys, checks the browser key *can't* call Places, and checks Supabase and RLS), push the migrations, resolve place IDs and fetch coordinates (cost estimate printed first; expected bill $0).
