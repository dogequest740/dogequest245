drop table if exists public.withdrawals;

create table if not exists public.seasons (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  pool_sol numeric not null default 0,
  status text not null default 'active',
  closed_at timestamptz,
  created_at timestamptz default now(),
  check (pool_sol >= 0),
  check (end_at > start_at)
);

create table if not exists public.season_snapshots (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons(id) on delete cascade,
  wallet text not null,
  name text not null default '',
  crystals_snapshot bigint not null default 0,
  premium_active boolean not null default false,
  effective_crystals numeric not null default 0,
  share numeric not null default 0,
  payout_sol numeric not null default 0,
  excluded boolean not null default false,
  exclude_reason text not null default '',
  created_at timestamptz default now(),
  unique (season_id, wallet),
  check (crystals_snapshot >= 0),
  check (effective_crystals >= 0),
  check (share >= 0),
  check (payout_sol >= 0)
);

create index if not exists seasons_status_idx on public.seasons(status, start_at desc);
create index if not exists season_snapshots_season_idx on public.season_snapshots(season_id);
create index if not exists season_snapshots_season_effective_idx on public.season_snapshots(season_id, effective_crystals desc);
create index if not exists season_snapshots_season_payout_idx on public.season_snapshots(season_id, payout_sol desc);

alter table public.seasons enable row level security;
alter table public.season_snapshots enable row level security;

drop policy if exists "public seasons read/write" on public.seasons;
drop policy if exists "public season snapshots read/write" on public.season_snapshots;
drop policy if exists "seasons no client read" on public.seasons;
drop policy if exists "season snapshots no client read" on public.season_snapshots;

create policy "seasons no client read"
on public.seasons
for select
using (false);

create policy "season snapshots no client read"
on public.season_snapshots
for select
using (false);

create or replace function public.close_active_season()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  active_season public.seasons%rowtype;
  snapshot_time timestamptz := now();
  total_effective numeric := 0;
begin
  select *
  into active_season
  from public.seasons
  where status = 'active'
  order by start_at desc
  limit 1
  for update;

  if not found then
    raise exception 'No active season';
  end if;

  if exists (
    select 1 from public.season_snapshots where season_id = active_season.id
  ) then
    raise exception 'Season already closed';
  end if;

  insert into public.season_snapshots (
    season_id,
    wallet,
    name,
    crystals_snapshot,
    premium_active,
    effective_crystals,
    share,
    payout_sol,
    excluded,
    exclude_reason,
    created_at
  )
  select
    active_season.id,
    p.wallet,
    left(trim(coalesce(p.state ->> 'name', 'Unknown')), 24),
    greatest(0, floor(coalesce((p.state ->> 'crystals')::numeric, 0)))::bigint,
    coalesce((p.state ->> 'premiumEndsAt')::bigint, 0) > floor(extract(epoch from snapshot_time) * 1000),
    case
      when coalesce((p.state ->> 'premiumEndsAt')::bigint, 0) > floor(extract(epoch from snapshot_time) * 1000)
        then greatest(0, floor(coalesce((p.state ->> 'crystals')::numeric, 0)))::numeric * 1.5
      else greatest(0, floor(coalesce((p.state ->> 'crystals')::numeric, 0)))::numeric
    end,
    0,
    0,
    false,
    '',
    snapshot_time
  from public.profiles p;

  select coalesce(sum(effective_crystals), 0)
  into total_effective
  from public.season_snapshots
  where season_id = active_season.id
    and excluded = false;

  if total_effective > 0 then
    update public.season_snapshots
    set
      share = effective_crystals / total_effective,
      payout_sol = round(active_season.pool_sol * (effective_crystals / total_effective), 9)
    where season_id = active_season.id
      and excluded = false;
  end if;

  update public.profiles
  set
    state = jsonb_set(state, '{crystals}', '0'::jsonb, true),
    updated_at = snapshot_time
  where wallet is not null;

  update public.seasons
  set
    status = 'closed',
    closed_at = snapshot_time
  where id = active_season.id;

  return active_season.id;
end;
$$;
