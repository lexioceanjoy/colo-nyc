# M3 human steps (H5b): Google sign-in, about 10 minutes

1. **Supabase auth URLs** (production project `colo-nyc`): Dashboard → **Authentication → URL Configuration**
   - Site URL: `https://colo-nyc.vercel.app`
   - Redirect URLs → **Add URL**: `https://colo-nyc.vercel.app/**` and `http://localhost:3000/**` → **Save**
2. **Copy the Supabase callback URL:** **Authentication → Sign In / Providers → Google** → copy the **Callback URL (for OAuth)** shown there (it looks like `https://<project-ref>.supabase.co/auth/v1/callback`). Leave this tab open.
3. **Google consent screen:** https://console.cloud.google.com (project `colo-nyc`) → ☰ → **Google Auth Platform → Branding** (older UI: **APIs & Services → OAuth consent screen**) → **Get started**:
   - App name `Colo NYC`, support email = yours → Audience **External** → contact email → agree → **Create**
   - **Branding** page: App domain → Home page `https://colo-nyc.vercel.app`, Privacy policy `https://colo-nyc.vercel.app/en/privacy` (I'm building that page in M3), Authorized domains → add `vercel.app` and `supabase.co` → **Save**
   - **Audience** → **Publish app** → confirm. (Only basic profile and email scopes are used, so no Google verification review is needed.)
4. **OAuth client:** **Google Auth Platform → Clients → + Create client** → Application type **Web application** → Name `colo-supabase` → **Authorized redirect URIs → + Add URI** → paste the Supabase callback URL from step 2 → **Create**. Copy the **Client ID** and **Client secret**.
5. Back in Supabase (step 2 tab): toggle **Enable Sign in with Google** → paste the Client ID and Client secret → **Save**.
6. Say **"done"**. I'll test sign-in end to end on production.

(The client ID/secret live only in Supabase. Don't paste them into chat or `.env.local`.)
