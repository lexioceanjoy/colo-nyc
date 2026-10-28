-- Crowd confirmations for the 5 core details (2026-10-28).
-- One vote per person per spot detail (changeable). A value is "confirmed" once 2+ different people agree
-- and no other value has more votes. Votes are private; only the confirmed aggregate is public.

create table public.detail_votes (
  user_id    uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  spot_slug  text not null check (spot_slug ~ '^[a-z0-9-]{1,80}$'),
  field      text not null check (field in ('wifi', 'outlets', 'laptopPolicy', 'noise', 'hours')),
  value      text not null check (
    (field = 'wifi' and value in ('strong', 'ok', 'weak', 'none')) or
    (field = 'outlets' and value in ('many', 'some', 'few', 'none')) or
    (field = 'laptopPolicy' and value in ('welcome', 'weekdays_only', 'restricted_areas', 'discouraged')) or
    (field = 'noise' and value in ('quiet', 'moderate', 'lively')) or
    -- hours: "<weekday>|<weekend>", each "HH-HH" (24h, close may be 24) or "closed", e.g. "07-18|08-17"
    (field = 'hours' and value ~ '^(([01][0-9]|2[0-3])-([01][0-9]|2[0-4])|closed)\|(([01][0-9]|2[0-3])-([01][0-9]|2[0-4])|closed)$')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, spot_slug, field)
);
alter table public.detail_votes enable row level security;
revoke all on public.detail_votes from anon;
create policy "votes read own" on public.detail_votes for select to authenticated using (user_id = (select auth.uid()));
create policy "votes insert own" on public.detail_votes for insert to authenticated with check (user_id = (select auth.uid()));
create policy "votes update own" on public.detail_votes for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "votes delete own" on public.detail_votes for delete to authenticated using (user_id = (select auth.uid()));
create trigger rl_detail_votes before insert or update on public.detail_votes for each row execute function public.enforce_rate_limit();

-- Public aggregate: no identities, only values with ≥2 agreeing people that strictly lead every other value.
create or replace function public.confirmed_details(p_slug text default null)
returns table (spot_slug text, field text, value text, votes bigint)
language sql stable security definer set search_path = '' as $$
  with tally as (
    select v.spot_slug, v.field, v.value, count(distinct v.user_id) as n
    from public.detail_votes v
    join public.profiles p on p.id = v.user_id and p.hidden = false
    where p_slug is null or v.spot_slug = p_slug
    group by v.spot_slug, v.field, v.value
  ), ranked as (
    select t.*, rank() over (partition by t.spot_slug, t.field order by t.n desc) as r,
           count(*) over (partition by t.spot_slug, t.field, t.n) as ties
    from tally t
  )
  select spot_slug, field, value, n from ranked where n >= 2 and r = 1 and ties = 1;
$$;
grant execute on function public.confirmed_details(text) to anon, authenticated;
