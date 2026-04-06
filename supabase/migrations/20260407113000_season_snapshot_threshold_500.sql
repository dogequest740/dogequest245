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
    payout_usdt,
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
  from public.profiles p
  where greatest(0, floor(coalesce((p.state ->> 'crystals')::numeric, 0)))::bigint >= 500;

  select coalesce(sum(effective_crystals), 0)
  into total_effective
  from public.season_snapshots
  where season_id = active_season.id
    and excluded = false;

  if total_effective > 0 then
    update public.season_snapshots
    set
      share = effective_crystals / total_effective,
      payout_usdt = round(active_season.pool_usdt * (effective_crystals / total_effective), 9)
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
