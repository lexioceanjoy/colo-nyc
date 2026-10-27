# M2 human steps (H6): Vercel, about 5 minutes

1. **Import the repo:** https://vercel.com/new → **Continue with GitHub** (authorize if asked) → pick **lexioceanjoy/colo-nyc** → **Import**.
   - Project Name: **`colo-nyc`** (this gives `colo-nyc.vercel.app`, which matches the browser key's allowed referrer).
   - Framework: Next.js (auto). Leave build settings at their defaults.
   - **Don't click Deploy yet** if it offers Environment Variables. Skip that section; step 2 fills it in. (If it already deployed, that's fine: the first deploy just has no map or Supabase.)
2. **Env vars, two options:**
   - **CLI (fastest):** in this terminal run `! npm i -g vercel && vercel login && vercel link --yes --project colo-nyc`, then `! bash scripts/push-vercel-env.sh`.
   - **Dashboard:** Project → **Settings → Environment Variables** → add each line from `.env.local` that `scripts/push-vercel-env.sh` lists. Put `NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY` and `NEXT_PUBLIC_GOOGLE_MAP_ID` in **Production only**, and set `NEXT_PUBLIC_SITE_URL=https://colo-nyc.vercel.app`.
3. **Deploy hook** (for the weekly coordinate refresh): Project → **Settings → Git → Deploy Hooks** → Name `weekly-refresh`, Branch `main` → **Create Hook** → copy the URL into `.env.local` → `VERCEL_DEPLOY_HOOK_URL`.
4. **Analytics:** Project → **Analytics** tab → **Enable** (Web Analytics, cookieless).
5. Run `! bash scripts/push-secrets.sh` (GitHub Actions secrets, including the deploy hook; still pending from M0). **Type it with no spaces before the `!`.**
6. Say **"done"**. I'll redeploy, check the live URL on phone and desktop sizes in both languages, test link previews, and run Lighthouse against production.
