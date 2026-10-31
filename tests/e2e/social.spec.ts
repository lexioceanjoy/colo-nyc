import { expect, test, type BrowserContext } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { userClick } from "./support/reach";

// Social E2E (SPEC §10). Runs only via `pnpm e2e:social`, which builds against the Supabase TEST project.
// Test auth: users are created with the service role and signed in with a password, not Google OAuth.
test.skip(!process.env.E2E_SOCIAL, "run with pnpm e2e:social (test Supabase project)");
test.describe.configure({ mode: "serial" });

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SVC = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Isolation: every run (CI job or local) gets its own users and its own spots in the shared TEST project, so
// parallel runs from different PRs don't collide. scripts/e2e-social.ts sets E2E_RUN_ID (and ADMIN_EMAILS from it).
const RUN = process.env.E2E_RUN_ID ?? "local";
const emailFor = (who: string) => `e2e-${RUN}-${who}@colo-nyc.test`;
const STALE_MS = 6 * 60 * 60 * 1000; // test users older than this are leftovers from crashed runs

type RawSpot = { slug: string; closed?: boolean; hours: { value: unknown; confidence: string }; work: Record<string, { value: unknown; confidence: string }> };
const ALL_SPOTS: RawSpot[] = JSON.parse(readFileSync("src/data/spots.json", "utf8"));
const taken = new Set<string>();
/** A spot only this run uses: hash the run ID over the eligible spots, never reusing one within the run. */
function pickSpot(purpose: string, ok: (s: RawSpot) => boolean): RawSpot | undefined {
  const pool = ALL_SPOTS.filter((s) => ok(s) && !taken.has(s.slug));
  if (pool.length === 0) return undefined;
  const spot = pool[createHash("sha1").update(`${RUN}:${purpose}`).digest().readUInt32BE(0) % pool.length];
  taken.add(spot.slug);
  return spot;
}
const CORE = ["wifi", "outlets", "laptopPolicy", "noise"];
/** Core details known (4 work details + hours); 3+ means the spot is listed on the map. */
const knownOf = (x: RawSpot) => CORE.filter((k) => x.work[k].value !== "unknown").length + (x.hours.value !== "unknown" ? 1 : 0);
const SPOT = pickSpot("checkin", (s) => !s.closed && knownOf(s) >= 3)!.slug;
const VERIFY_SPOT = pickSpot("verify", (s) => !s.closed && knownOf(s) >= 3)!.slug;

type TestUser = { id: string; email: string; password: string; name: string };
const users: Record<"admin" | "bea" | "cal", TestUser> = {
  admin: { id: "", email: emailFor("admin"), password: "", name: "Ada" },
  bea: { id: "", email: emailFor("bea"), password: "", name: "Bea" },
  cal: { id: "", email: emailFor("cal"), password: "", name: "Cal" },
};
const ids = () => Object.values(users).map((u) => u.id).filter(Boolean);
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
  // Sweep test users left by crashed runs (their rows cascade). Never touches users of runs still in progress.
  const stale = (await svc.auth.admin.listUsers({ perPage: 1000 })).data.users.filter(
    (u) => /^(e2e|rls-probe)-.*@colo-nyc\.test$/.test(u.email ?? "") && Date.now() - Date.parse(u.created_at) > STALE_MS,
  );
  for (const u of stale) await svc.auth.admin.deleteUser(u.id);
  for (const u of Object.values(users)) await resetUser(u);
  await svc.from("spot_overrides").delete().eq("slug", VERIFY_SPOT);
});

// Clean up this run: deleting the users cascades their profiles, check-ins, sessions, RSVPs, reports, votes,
// submissions and admin rows; the verify override isn't user-owned, so it goes explicitly.
test.afterAll(async () => {
  for (const id of ids()) await svc.auth.admin.deleteUser(id).catch(() => undefined); // cal may already be gone
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
  await userClick(page, page.getByTestId("checkin-open"));
  await userClick(page, page.getByText("Afternoon"));
  await userClick(page, page.getByText("A chat"));
  await userClick(page, page.getByTestId("checkin-save"));
  await expect(page.getByTestId("checkin-name").filter({ hasText: "Bea" })).toContainText("(you)");
  await expect(page.getByTestId("here-count")).toHaveText(/2 people here today/);
  await userClick(page, page.getByTestId("checkout"));
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


async function report(browser: import("@playwright/test").Browser, u: TestUser, slug: string, field: string, label: string) {
  const ctx = await browser.newContext();
  await signInAs(ctx, u);
  const page = await ctx.newPage();
  await page.goto(`/en/spot/${slug}`);
  await page.getByTestId(`know-${field}`).first().click();
  await page.getByTestId(`crowd-${field}`).getByRole("button", { name: label, exact: true }).click();
  await expect(page.getByTestId(`crowd-${field}`).getByRole("status")).toContainText("on the page now");
  await ctx.close();
}

async function anonSees(browser: import("@playwright/test").Browser, slug: string) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(`/en/spot/${slug}`);
  return { page, close: () => ctx.close() };
}

test("one report fills an unknown detail right away; two make it medium", async ({ browser }) => {
  const spot = pickSpot("noise-fill", (x) => !x.closed && knownOf(x) >= 3 && x.work.noise.value === "unknown");
  test.skip(!spot, "no listed spot with unknown noise");
  await svc.from("detail_votes").delete().eq("spot_slug", spot!.slug).in("user_id", ids());
  await report(browser, users.bea, spot!.slug, "noise", "Quiet");
  let v = await anonSees(browser, spot!.slug);
  await expect(v.page.getByTestId("crowd-label-noise")).toContainText("Reported by 1 visitor");
  await v.page.getByRole("button", { name: /Noise/ }).click();
  await expect(v.page.getByText("Low confidence").first()).toBeVisible();
  await v.close();
  await report(browser, users.admin, spot!.slug, "noise", "Quiet");
  v = await anonSees(browser, spot!.slug);
  await expect(v.page.getByTestId("crowd-label-noise")).toContainText("Reported by 2 visitors");
  await v.page.getByRole("button", { name: /Noise/ }).click();
  await expect(v.page.getByText("Medium confidence").first()).toBeVisible();
  await v.close();
});

test("a 1–1 split says 'Visitors disagree' and shows the latest report", async ({ browser }) => {
  const spot = pickSpot("outlets-split", (x) => !x.closed && knownOf(x) >= 3 && x.work.outlets.value === "unknown");
  test.skip(!spot, "no listed spot with unknown outlets");
  await svc.from("detail_votes").delete().eq("spot_slug", spot!.slug).in("user_id", ids());
  await report(browser, users.bea, spot!.slug, "outlets", "Few");
  await report(browser, users.admin, spot!.slug, "outlets", "Plenty");
  const v = await anonSees(browser, spot!.slug);
  await expect(v.page.getByTestId("crowd-label-outlets")).toContainText("Visitors disagree");
  await expect(v.page.getByRole("button", { name: /Outlets/ })).toContainText("Plenty");
  await v.close();
});

test("one report can't overwrite a well-sourced detail, two can", async ({ browser }) => {
  const spot = pickSpot("wifi-overwrite", (x) => !x.closed && knownOf(x) >= 3 && x.work.wifi.value === "strong" && x.work.wifi.confidence !== "low");
  test.skip(!spot, "no listed spot with medium/high strong wifi");
  await svc.from("detail_votes").delete().eq("spot_slug", spot!.slug).in("user_id", ids());
  // A real report through the UI (which re-renders the page), disagreeing with well-sourced research.
  await report(browser, users.bea, spot!.slug, "wifi", "None");
  const v = await anonSees(browser, spot!.slug);
  await expect(v.page.getByRole("button", { name: /Wi-Fi/ }).first()).toContainText("Strong");
  await expect(v.page.getByTestId("crowd-label-wifi")).toHaveCount(0);
  await v.close();
  // A second person agreeing with the first does overwrite it (2 disagreeing reports).
  await report(browser, users.admin, spot!.slug, "wifi", "None");
  const v2 = await anonSees(browser, spot!.slug);
  await expect(v2.page.getByRole("button", { name: /Wi-Fi/ }).first()).toContainText("None");
  await expect(v2.page.getByTestId("crowd-label-wifi")).toContainText("Reported by 2 visitors");
  await v2.close();
  await svc.from("detail_votes").delete().eq("spot_slug", spot!.slug).in("user_id", ids());
});

test("a report can bring a hidden spot onto the map, and admin reset clears it", async ({ browser }) => {
  const spot = pickSpot("unhide", (x) => !x.closed && knownOf(x) === 2 && x.work.noise.value === "unknown");
  test.skip(!spot, "no 2-of-5 spot with unknown noise");
  await svc.from("detail_votes").delete().eq("spot_slug", spot!.slug).in("user_id", ids());
  let v = await anonSees(browser, spot!.slug);
  await expect(v.page.getByTestId("not-listed")).toBeVisible();
  await v.close();
  await report(browser, users.bea, spot!.slug, "noise", "Moderate");
  v = await anonSees(browser, spot!.slug);
  await expect(v.page.getByTestId("not-listed")).toHaveCount(0);
  await v.close();

  const ctx = await browser.newContext();
  await svc.from("admins").upsert({ user_id: users.admin.id });
  await signInAs(ctx, users.admin);
  const page = await ctx.newPage();
  await page.goto("/en/admin");
  await page.getByTestId(`reset-${spot!.slug}-noise`).click();
  await expect(page.getByTestId(`reset-${spot!.slug}-noise`)).toHaveCount(0);
  await ctx.close();
  v = await anonSees(browser, spot!.slug);
  await expect(v.page.getByTestId("not-listed")).toBeVisible();
  await v.close();
});

test("check-in asks 'How's it here?' only about missing details", async ({ page, context }) => {
  const missingOf = (x: RawSpot) => CORE.filter((k) => x.work[k].value === "unknown");
  // pickSpot never reuses a spot within the run, so this can't share a (cached) page with the crowd tests.
  const spot = pickSpot("hows-it-here", (x) => !x.closed && x.hours.value !== "unknown" && missingOf(x).includes("outlets") && 5 - missingOf(x).length >= 3);
  test.skip(!spot, "no listed spot with unknown outlets");
  await svc.from("detail_votes").delete().eq("spot_slug", spot!.slug).in("user_id", ids());
  await signInAs(context, users.bea);
  await page.goto(`/en/spot/${spot!.slug}`);
  await userClick(page, page.getByTestId("checkin-open"));
  await userClick(page, page.getByTestId("checkin-save"));
  const card = page.getByTestId("hows-it-here");
  await expect(card).toBeVisible();
  await expect(card.getByTestId("crowd-outlets")).toBeVisible();
  await expect(card.getByTestId("crowd-hours")).toHaveCount(0); // hours are known here, so not asked
  await userClick(page, page.getByTestId("checkout"));
});

test("a signed-in suggestion stores quick answers and credit; duplicates are caught", async ({ page, context }) => {
  const name = `E2E Test Cafe ${Date.now()}`;
  await signInAs(context, users.bea);
  await page.goto("/en/submit");
  await page.locator('input[name="name"]').fill(name);
  await page.locator('select[name="neighborhood"]').selectOption("greenpoint");
  await page.locator('input[name="address_or_link"]').fill("1 Test St, Brooklyn, NY 11222");
  await userClick(page, page.getByTestId("quick-taps").getByText("Strong", { exact: true }));
  await userClick(page, page.getByTestId("quick-taps").getByText("Quiet", { exact: true }));
  await userClick(page, page.getByText(/Show "Suggested by Bea"/));
  await userClick(page, page.getByTestId("submit-send"));
  await expect(page.getByTestId("submit-done")).toBeVisible();
  const { data: sub } = await svc.from("spot_submissions").select("id,user_id,submission_extras(neighborhood,answers,credit)").eq("name", name).single();
  const rel = (sub as unknown as { submission_extras: unknown }).submission_extras;
  const extras = (Array.isArray(rel) ? rel[0] : rel) as { neighborhood: string; answers: Record<string, string>; credit: boolean };
  expect(sub!.user_id).toBe(users.bea.id);
  expect(extras).toEqual({ neighborhood: "greenpoint", answers: { wifi: "strong", noise: "quiet" }, credit: true });

  // Same place again while it's still queued → refused as a duplicate.
  await page.goto("/en/submit");
  await page.locator('input[name="name"]').fill(name);
  await page.locator('select[name="neighborhood"]').selectOption("greenpoint");
  await page.locator('input[name="address_or_link"]').fill("1 Test St");
  await userClick(page, page.getByTestId("submit-send"));
  await expect(page.getByText(/already suggested this one/)).toBeVisible();

  // A spot that's already on the map → link to it.
  await page.goto("/en/submit");
  await page.locator('input[name="name"]').fill("The Lost Draft");
  await page.locator('select[name="neighborhood"]').selectOption("nolita");
  await page.locator('input[name="address_or_link"]').fill("398 Broome St");
  await userClick(page, page.getByTestId("submit-send"));
  await expect(page.getByTestId("submit-duplicate")).toContainText("Already on the map");
  await expect(page.getByTestId("submit-duplicate").getByRole("link")).toHaveAttribute("href", "/en/spot/the-lost-draft-nolita");
  await svc.from("spot_submissions").delete().eq("id", sub!.id);
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
