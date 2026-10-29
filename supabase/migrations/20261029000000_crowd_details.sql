-- Phase 1 (docs/NEXT-PHASES.md): single-report crowd details. Add-only: new function, nothing existing changes.
-- For each spot × core detail, return the winning reported value:
--   most distinct reporters wins; on a tie the most recently reported value wins and `disagree` is true.
-- Only signed-in, non-hidden users' votes count (votes already require auth via RLS on detail_votes).

create or replace function public.crowd_details(p_slug text default null)
returns table (spot_slug text, field text, value text, reports bigint, total bigint, disagree boolean, last_at timestamptz)
language sql stable security definer set search_path = '' as $$
  with tally as (
    select v.spot_slug, v.field, v.value,
           count(distinct v.user_id) as n,
           max(v.updated_at) as last_at
    from public.detail_votes v
    join public.profiles p on p.id = v.user_id and p.hidden = false
    where p_slug is null or v.spot_slug = p_slug
    group by v.spot_slug, v.field, v.value
  ), ranked as (
    select t.*,
           row_number() over (partition by t.spot_slug, t.field order by t.n desc, t.last_at desc) as rn,
           count(*) over (partition by t.spot_slug, t.field, t.n) as same_n,
           sum(t.n) over (partition by t.spot_slug, t.field) as total
    from tally t
  )
  select spot_slug, field, value, n, total, same_n > 1, last_at
  from ranked
  where rn = 1;
$$;
grant execute on function public.crowd_details(text) to anon, authenticated;
