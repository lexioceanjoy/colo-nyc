import { expect, test, type BrowserContext } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Social E2E (SPEC §10). Runs only via `pnpm e2e:social`, which builds against the Supabase TEST project.
// Test auth: users are created with the service role and signed in with a password, not Google OAuth.
test.skip(!process.env.E2E_SOCIAL, "run with pnpm e2e:social (test Supabase project)");
test.describe.configure({ mode: "serial" });

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SVC = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const SPOT = "the-lost-draft-nolita";
const VERIFY_SPOT = "nook-bushwick";

type TestUser = { id: string; email: string; password: string; name: string };
const users: Record<"admin" | "bea" | "cal", TestUser> = {
  admin: { id: "", email: "e2e-admin@colo-nyc.test", password: "", name: "Ada" },
  bea: { id: "", email: "e2e-bea@colo-nyc.test", password: "", name: "Bea" },
  cal: { id: "", email: "e2e-cal@colo-nyc.test", password: "", name: "Cal" },
};
let svc: SupabaseClient;

async function resetUser(u: TestUser) {
  const existing = (await svc.auth.admin.listUsers({ perPage: 1000 })).data.users.find((x) => x.email === u.email);
  if (existing) await svc.auth.admin.deleteUser(existing.id); // cascades all their rows
  u.password = `pw-${crypto.randomUUID()}`;
  const { data, error } = await svc.auth.admin.createUser({ email: u.email, password: u.password, email_confirm: true });
  if (error) throw error;
  u.id = data.user!.id;
  await svc.from("profiles").upsert({ id: u.id, display_name: u.name, headline: `${u.name} the tester` });
}

/** Sign in with a password and store the session the way @supabase/ssr reads it (base64url, chunked at 3180). */
async function signInAs(ctx: BrowserContext, u: TestUser) {
  const anon = createClient(URL_, ANON, { auth: { persistSession: false } });
  const { data, error } = await anon.auth.signInWithPassword({ email: u.email, password: u.password });
  if (error) throw error;
  const ref = new URL(URL_).hostname.split(".")[0];
  const name = `sb-${ref}-auth-token`;
  const value = "base64-" + Buffer.from(JSON.stringify(data.session)).toString("base64url");
  const chunks = value.length <= 3180 ? [[name, value]] : (value.match(/.{1,3180}/g) ?? []).map((c, i) => [`${name}.${i}`, c]);
  await ctx.addCookies(chunks.map(([n, v]) => ({ name: n, value: v, url: "http://localhost:3100", sameSite: "Lax" as const })));
}

test.beforeAll(async () => {
  svc = createClient(URL_, SVC, { auth: { persistSession: false } });
  for (const u of Object.values(users)) await resetUser(u);
  await svc.from("spot_overrides").delete().eq("slug", VERIFY_SPOT);
});

test("anonymous visitors see counts but never names", async ({ page }) => {
  await svc.from("checkins").insert({ user_id: users.cal.id, spot_slug: SPOT, window: "morning", note: "secret note" });
  await page.goto(`/en/spot/${SPOT}`);
  await expect(page.getByTestId("here-count")).toHaveText(/1 person here today/);
  await expect(page.getByTestId("checkin-name")).toHaveCount(0);
  await expect(page.getByText("Cal", { exact: true })).toHaveCount(0);
  await expect(page.getByText("secret note")).toHaveCount(0);
  await expect(page.getByTestId("signin-to-checkin")).toBeVisible();
});

test("a signed-in user can check in, see themselves, and check out", async ({ page, context }) => {
  await signInAs(context, users.bea);
  await page.goto(`/en/spot/${SPOT}`);
  await expect(page.getByTestId("checkin-name").filter({ hasText: "Cal" })).toBeVisible();
  await page.getByTestId("checkin-open").click();
  await page.getByText("Afternoon").click();
  await page.getByText("A chat").click();
  await page.getByTestId("checkin-save").click();
  await expect(page.getByTestId("checkin-name").filter({ hasText: "Bea" })).toContainText("(you)");
  await expect(page.getByTestId("here-count")).toHaveText(/2 people here today/);
  await page.getByTestId("checkout").click();
  await expect(page.getByTestId("checkin-name").filter({ hasText: "Bea" })).toHaveCount(0);
});

test("two reports auto-hide a check-in", async ({ browser }) => {
  const { data: target } = await svc.from("checkins").select("id").eq("user_id", users.cal.id).single();
  for (const u of [users.bea, users.admin]) {
    const ctx = await browser.newContext();
    await signInAs(ctx, u);
    const page = await ctx.newPage();
    await page.goto(`/en/spot/${SPOT}`);
    await page.getByTestId("checkin-list").getByRole("button", { name: "Report" }).first().click();
    await expect(page.getByRole("status").filter({ hasText: "Reported" })).toBeVisible();
    await ctx.close();
  }
  await expect.poll(async () => (await svc.from("checkins").select("hidden").eq("id", target!.id).single()).data?.hidden).toBe(true);
  const ctx = await browser.newContext();
  await signInAs(ctx, users.bea);
  const page = await ctx.newPage();
  await page.goto(`/en/spot/${SPOT}`);
  await expect(page.getByTestId("here-count")).toHaveText(/Nobody checked in/);
  await ctx.close();
});

test("host a session, RSVP, and the host sees who's coming", async ({ browser }) => {
  const host = await browser.newContext();
  await signInAs(host, users.bea);
  const hp = await host.newPage();
  await hp.goto(`/en/sessions/new?spot=${SPOT}`);
  const tomorrow = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(new Date(Date.now() + 86400000));
  await hp.locator('input[name="date"]').fill(tomorrow);
  await hp.locator('input[name="title"]').fill("E2E deep work");
  await hp.locator('input[name="capacity"]').fill("3");
  await hp.locator('input[name="start"]').fill("10:00");
  await hp.locator('input[name="end"]').fill("12:00");
  await hp.getByTestId("host-submit").click();
  await expect(hp).toHaveURL(/\/en\/sessions\/[0-9a-f-]{36}\?created=1/);
  const sessionUrl = hp.url().split("?")[0];
  await expect(hp.getByTestId("going-count")).toHaveText("1/3 going");

  const guest = await browser.newContext();
  await signInAs(guest, users.cal);
  const gp = await guest.newPage();
  await gp.goto(sessionUrl);
  await gp.getByTestId("rsvp").click();
  await expect(gp.getByTestId("going-count")).toHaveText("2/3 going");

  await hp.reload();
  await expect(hp.getByTestId("attendees")).toContainText("Cal");

  // Anonymous share page: count only, no names; OG image renders.
  const anon = await browser.newContext();
  const ap = await anon.newPage();
  await ap.goto(sessionUrl);
  await expect(ap.getByTestId("going-count")).toHaveText("2/3 going");
  await expect(ap.getByTestId("attendees")).toHaveCount(0);
  const og = await ap.request.get(`${sessionUrl}/opengraph-image`);
  expect(og.status()).toBe(200);
  expect(og.headers()["content-type"]).toContain("image/png");
  await Promise.all([host.close(), guest.close(), anon.close()]);
});

test("the admin verifies a spot without a deploy", async ({ browser }) => {
  const ctx = await browser.newContext();
  await svc.from("admins").upsert({ user_id: users.admin.id }); // seeded by the OAuth callback in real sign-ins
  await signInAs(ctx, users.admin);
  const page = await ctx.newPage();
  await page.goto("/en/admin");
  await page.getByTestId(`verify-${VERIFY_SPOT}`).click();
  await expect(page.getByTestId(`verify-${VERIFY_SPOT}`)).toHaveText("Mark AI-researched");
  const anon = await browser.newContext();
  const ap = await anon.newPage();
  await ap.goto(`/en/spot/${VERIFY_SPOT}`);
  await expect(ap.getByTestId("status-badge")).toHaveText(/Verified by/);
  await Promise.all([ctx.close(), anon.close()]);
});

test("non-admins can't use /admin", async ({ page, context }) => {
  await signInAs(context, users.cal);
  await page.goto("/en/admin");
  await expect(page.getByText("This page is for admins.")).toBeVisible();
});

test("delete my account removes the user and their rows", async ({ page, context }) => {
  await signInAs(context, users.cal);
  await page.goto("/en/profile");
  await page.getByLabel("Type DELETE to confirm").fill("DELETE");
  await page.getByRole("button", { name: "Delete my account" }).click();
  await expect(page).toHaveURL(/\/en$/);
  await expect.poll(async () => (await svc.from("profiles").select("id").eq("id", users.cal.id)).data?.length).toBe(0);
  expect((await svc.from("rsvps").select("user_id").eq("user_id", users.cal.id)).data?.length).toBe(0);
});
