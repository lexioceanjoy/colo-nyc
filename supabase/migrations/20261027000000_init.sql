-- Colo NYC schema (SPEC §4.2, §4.4). Time/row-dependent rules are triggers, not CHECKs.

-- ───────────────────────── Google coordinate cache (≤ 30 days) ─────────────────────────
create table public.place_geo (
  place_id   text primary key,
  lat        double precision not null,
  lng        double precision not null,
  fetched_at timestamptz not null default now()
);
alter table public.place_geo enable row level security;
create policy "place_geo public read" on public.place_geo for select to anon, authenticated using (true);
-- writes: service role only (bypasses RLS); no write policies on purpose.

-- ───────────────────────── Verified overrides (admin, merged at runtime) ─────────────────
create table public.spot_overrides (
  slug        text primary key,
  status      text not null check (status in ('ai_researched', 'verified')),
  verified_by text,
  verified_at timestamptz
);
alter table public.spot_overrides enable row level security;
create policy "overrides public read" on public.spot_overrides for select to anon, authenticated using (true);

-- ───────────────────────── Admins (seeded from ADMIN_EMAILS by scripts/seed-admins.ts) ──
create table public.admins (user_id uuid primary key references auth.users (id) on delete cascade);
alter table public.admins enable row level security;
create policy "admins read self" on public.admins for select to authenticated using (user_id = (select auth.uid()));

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- ───────────────────────── Profiles ─────────────────────────────────────────────────────
create table public.profiles (
  id             uuid primary key references auth.users (id) on delete cascade,
  display_name   text not null check (char_length(btrim(display_name)) between 1 and 40),
  headline       text check (char_length(headline) <= 80),
  link_url       text check (link_url is null or (link_url ~ '^https://[^\s]+$' and char_length(link_url) <= 200)),
  community_tags text[] not null default '{}' check (community_tags <@ array['next_play']::text[]),
  locale         text not null default 'en' check (locale in ('en', 'zh')),
  hidden         boolean not null default false,
  created_at     timestamptz not null default now()
);
alter table public.profiles enable row level security;
-- Anonymous users never see names (SPEC §4.4/§7).
revoke all on public.profiles from anon;
create policy "profiles read (signed in)" on public.profiles for select to authenticated
  using (hidden = false or id = (select auth.uid()));
create policy "profiles insert own" on public.profiles for insert to authenticated with check (id = (select auth.uid()));
create policy "profiles update own" on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy "profiles delete own" on public.profiles for delete to authenticated using (id = (select auth.uid()));
-- Users can't un-hide themselves.
revoke update (hidden) on public.profiles from authenticated;

-- ───────────────────────── Check-ins ────────────────────────────────────────────────────
create table public.checkins (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  spot_slug  text not null check (spot_slug ~ '^[a-z0-9-]{1,80}$'),
  ny_date    date not null default ((now() at time zone 'America/New_York')::date),
  "window"   text not null check ("window" in ('morning', 'afternoon', 'evening', 'all_day')),
  open_to    text[] not null default '{}' check (open_to <@ array['chat', 'lunch', 'quiet_cowork', 'feedback']::text[]),
  note       text check (char_length(note) <= 120),
  hidden     boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, ny_date)
);
create index checkins_today on public.checkins (ny_date, spot_slug) where hidden = false;
alter table public.checkins enable row level security;
revoke all on public.checkins from anon;
create policy "checkins read (signed in)" on public.checkins for select to authenticated
  using (hidden = false or user_id = (select auth.uid()));
create policy "checkins insert own" on public.checkins for insert to authenticated with check (user_id = (select auth.uid()));
create policy "checkins update own" on public.checkins for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "checkins delete own" on public.checkins for delete to authenticated using (user_id = (select auth.uid()));
revoke update (hidden) on public.checkins from authenticated;

-- The server decides the NY date, never the client.
create or replace function public.checkins_set_ny_date()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.ny_date := (now() at time zone 'America/New_York')::date;
  return new;
end $$;
create trigger checkins_ny_date before insert or update on public.checkins
  for each row execute function public.checkins_set_ny_date();

-- ───────────────────────── Sessions & RSVPs ─────────────────────────────────────────────
create table public.sessions (
  id            uuid primary key default gen_random_uuid(),
  host_id       uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  spot_slug     text not null check (spot_slug ~ '^[a-z0-9-]{1,80}$'),
  starts_at     timestamptz not null,
  ends_at       timestamptz not null,
  title         text not null check (char_length(btrim(title)) between 1 and 60),
  description   text check (char_length(description) <= 300),
  capacity      int not null check (capacity between 2 and 12),
  community_tag text check (community_tag is null or community_tag in ('next_play')),
  hidden        boolean not null default false,
  created_at    timestamptz not null default now()
);
create index sessions_upcoming on public.sessions (starts_at) where hidden = false;
alter table public.sessions enable row level security;
revoke all on public.sessions from anon;
create policy "sessions read (signed in)" on public.sessions for select to authenticated
  using (hidden = false or host_id = (select auth.uid()));
create policy "sessions insert own" on public.sessions for insert to authenticated with check (host_id = (select auth.uid()));
create policy "sessions update own" on public.sessions for update to authenticated
  using (host_id = (select auth.uid())) with check (host_id = (select auth.uid()));
create policy "sessions delete own" on public.sessions for delete to authenticated using (host_id = (select auth.uid()));
revoke update (hidden) on public.sessions from authenticated;

create or replace function public.sessions_guard()
returns trigger language plpgsql security definer set search_path = '' as $$
declare upcoming int;
begin
  if new.starts_at < now() - interval '5 minutes' or new.starts_at > now() + interval '30 days' then
    raise exception 'session must start between now and 30 days from now' using errcode = 'check_violation';
  end if;
  if new.ends_at <= new.starts_at or new.ends_at - new.starts_at > interval '10 hours' then
    raise exception 'session must last between 0 and 10 hours' using errcode = 'check_violation';
  end if;
  select count(*) into upcoming from public.sessions
    where host_id = new.host_id and ends_at > now() and id <> new.id;
  if upcoming >= 3 then
    raise exception 'at most 3 upcoming sessions per host' using errcode = 'check_violation';
  end if;
  return new;
end $$;
create trigger sessions_guard before insert or update of starts_at, ends_at, host_id on public.sessions
  for each row execute function public.sessions_guard();

create table public.rsvps (
  session_id uuid not null references public.sessions (id) on delete cascade,
  user_id    uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (session_id, user_id)
);
alter table public.rsvps enable row level security;
revoke all on public.rsvps from anon;
create policy "rsvps read (signed in)" on public.rsvps for select to authenticated using (true);
create policy "rsvps insert own" on public.rsvps for insert to authenticated with check (user_id = (select auth.uid()));
create policy "rsvps delete own" on public.rsvps for delete to authenticated using (user_id = (select auth.uid()));

create or replace function public.rsvps_capacity()
returns trigger language plpgsql security definer set search_path = '' as $$
declare cap int; going int;
begin
  select capacity into cap from public.sessions where id = new.session_id and hidden = false and ends_at > now();
  if cap is null then raise exception 'session not open' using errcode = 'check_violation'; end if;
  select count(*) into going from public.rsvps where session_id = new.session_id;
  if going >= cap then raise exception 'session is full' using errcode = 'check_violation'; end if;
  return new;
end $$;
create trigger rsvps_capacity before insert on public.rsvps for each row execute function public.rsvps_capacity();

-- Hosts are always going.
create or replace function public.sessions_host_rsvp()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.rsvps (session_id, user_id) values (new.id, new.host_id) on conflict do nothing;
  return new;
end $$;
create trigger sessions_host_rsvp after insert on public.sessions for each row execute function public.sessions_host_rsvp();

-- Anonymous-safe view: no host or attendee identity (SPEC §4.4). Runs with owner rights on purpose.
create view public.public_sessions with (security_invoker = false) as
  select s.id, s.spot_slug, s.starts_at, s.ends_at, s.title, s.description, s.capacity, s.community_tag,
         (select count(*) from public.rsvps r where r.session_id = s.id)::int as rsvp_count
  from public.sessions s
  where s.hidden = false and s.ends_at > now() - interval '1 day';
grant select on public.public_sessions to anon, authenticated;

-- ───────────────────────── Reports (2 distinct reporters → hidden) ─────────────────────
create table public.reports (
  id          uuid primary key default gen_random_uuid(),
  reporter_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  target_type text not null check (target_type in ('checkin', 'session', 'profile')),
  target_id   uuid not null,
  reason      text check (char_length(reason) <= 200),
  created_at  timestamptz not null default now(),
  unique (reporter_id, target_type, target_id)
);
alter table public.reports enable row level security;
create policy "reports insert own" on public.reports for insert to authenticated with check (reporter_id = (select auth.uid()));
create policy "reports read own" on public.reports for select to authenticated using (reporter_id = (select auth.uid()));

create or replace function public.reports_autohide()
returns trigger language plpgsql security definer set search_path = '' as $$
declare n int;
begin
  select count(distinct reporter_id) into n from public.reports
    where target_type = new.target_type and target_id = new.target_id;
  if n >= 2 then
    if new.target_type = 'checkin' then update public.checkins set hidden = true where id = new.target_id;
    elsif new.target_type = 'session' then update public.sessions set hidden = true where id = new.target_id;
    elsif new.target_type = 'profile' then update public.profiles set hidden = true where id = new.target_id;
    end if;
  end if;
  return new;
end $$;
create trigger reports_autohide after insert on public.reports for each row execute function public.reports_autohide();

-- ───────────────────────── Submissions & corrections (service role only) ───────────────
create table public.spot_submissions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users (id) on delete cascade,
  name            text not null check (char_length(name) between 1 and 120),
  address_or_link text not null check (char_length(address_or_link) between 1 and 300),
  category        text not null check (category in ('cafe', 'library', 'pops', 'hotel_lobby', 'museum', 'other_public')),
  why             text check (char_length(why) <= 300),
  status          text not null default 'new' check (status in ('new', 'accepted', 'rejected')),
  created_at      timestamptz not null default now()
);
alter table public.spot_submissions enable row level security;

create table public.corrections (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users (id) on delete cascade,
  spot_slug  text not null check (spot_slug ~ '^[a-z0-9-]{1,80}$'),
  field      text not null check (char_length(field) <= 40),
  suggested  text not null check (char_length(suggested) between 1 and 200),
  status     text not null default 'new' check (status in ('new', 'accepted', 'rejected')),
  created_at timestamptz not null default now()
);
alter table public.corrections enable row level security;

-- ───────────────────────── Rate limits (20 writes / user / NY day) ─────────────────────
create table public.rate_limits (
  key     text not null,
  ny_date date not null,
  count   int not null default 0,
  primary key (key, ny_date)
);
alter table public.rate_limits enable row level security;

create or replace function public.enforce_rate_limit()
returns trigger language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); n int;
begin
  if uid is null then return coalesce(new, old); end if; -- service role / server actions
  insert into public.rate_limits as r (key, ny_date, count)
    values (uid::text, (now() at time zone 'America/New_York')::date, 1)
    on conflict (key, ny_date) do update set count = r.count + 1
    returning count into n;
  if n > 20 then raise exception 'daily write limit reached' using errcode = 'P0001'; end if;
  return coalesce(new, old);
end $$;
create trigger rl_checkins before insert or update on public.checkins for each row execute function public.enforce_rate_limit();
create trigger rl_sessions before insert or update on public.sessions for each row execute function public.enforce_rate_limit();
create trigger rl_rsvps before insert on public.rsvps for each row execute function public.enforce_rate_limit();
create trigger rl_reports before insert on public.reports for each row execute function public.enforce_rate_limit();
create trigger rl_profiles before update on public.profiles for each row execute function public.enforce_rate_limit();

-- Server-action rate limit for anonymous submit/corrections (hashed IP key, 5/day). Service role only.
create or replace function public.bump_rate_limit(p_key text, p_max int)
returns boolean language plpgsql security definer set search_path = '' as $$
declare n int;
begin
  insert into public.rate_limits as r (key, ny_date, count)
    values (p_key, (now() at time zone 'America/New_York')::date, 1)
    on conflict (key, ny_date) do update set count = r.count + 1
    returning count into n;
  return n <= p_max;
end $$;
revoke execute on function public.bump_rate_limit(text, int) from public, anon, authenticated;

-- ───────────────────────── Anonymous aggregate: today's counts ─────────────────────────
create or replace function public.today_counts()
returns table (spot_slug text, count bigint)
language sql stable security definer set search_path = '' as $$
  select c.spot_slug, count(*)
  from public.checkins c
  where c.ny_date = (now() at time zone 'America/New_York')::date and c.hidden = false
  group by c.spot_slug;
$$;
grant execute on function public.today_counts() to anon, authenticated;

-- Internal trigger functions are not callable through the API.
revoke execute on function public.checkins_set_ny_date(), public.sessions_guard(), public.rsvps_capacity(),
  public.sessions_host_rsvp(), public.reports_autohide(), public.enforce_rate_limit() from public, anon, authenticated;

-- ───────────────────────── Nightly cleanup (pg_cron) ───────────────────────────────────
create extension if not exists pg_cron with schema pg_catalog;
select cron.schedule(
  'colo-nightly-cleanup',
  '15 8 * * *', -- 04:15 NY (UTC-4) / 03:15 (UTC-5)
  $$
    delete from public.checkins where ny_date < (now() at time zone 'America/New_York')::date - 7;
    delete from public.place_geo where fetched_at < now() - interval '30 days';
    delete from public.rate_limits where ny_date < (now() at time zone 'America/New_York')::date - 2;
  $$
);
