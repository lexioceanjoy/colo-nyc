-- Phase 2 (docs/NEXT-PHASES.md): spot suggestions as a real flow. Add-only: one new table, nothing existing changes.
-- Extra fields for a spot_submissions row: neighborhood, the submitter's optional answers for the 5 core details,
-- whether they want credit on the spot page, and the slug it became once added by `pnpm data:intake`.

create table public.submission_extras (
  submission_id uuid primary key references public.spot_submissions (id) on delete cascade,
  neighborhood  text check (neighborhood is null or neighborhood ~ '^[a-z_]{2,40}$'),
  answers       jsonb not null default '{}'::jsonb check (
    jsonb_typeof(answers) = 'object'
    and (answers - array['wifi', 'outlets', 'laptopPolicy', 'noise', 'hours']) = '{}'::jsonb
  ),
  credit        boolean not null default false,
  intake_slug   text check (intake_slug is null or intake_slug ~ '^[a-z0-9-]{1,80}$'),
  intake_at     timestamptz,
  created_at    timestamptz not null default now()
);
-- Service role only (server actions + intake script): RLS on, no policies.
alter table public.submission_extras enable row level security;
revoke all on public.submission_extras from anon, authenticated;
