create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  wallet text primary key,
  state jsonb not null,
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

drop policy if exists "public read/write" on public.profiles;
drop policy if exists "profiles read only" on public.profiles;
drop policy if exists "profiles no client read" on public.profiles;

create policy "profiles no client read"
on public.profiles
for select
using (false);

create table if not exists public.world_boss (
  id int primary key,
  cycle_start timestamptz not null,
  cycle_end timestamptz not null,
  prize_pool int not null default 500,
  last_cycle_start timestamptz,
  last_cycle_end timestamptz,
  last_prize_pool int,
  updated_at timestamptz default now()
);

create table if not exists public.world_boss_participants (
  wallet text not null,
  cycle_start timestamptz not null,
  name text not null,
  damage bigint not null default 0,
  joined boolean not null default false,
  reward_claimed boolean not null default false,
  updated_at timestamptz default now(),
  primary key (wallet, cycle_start)
);

create table if not exists public.world_boss_tickets (
  wallet text primary key,
  tickets int not null default 0,
  premium_ticket_day text not null default '',
  starter_ticket_granted boolean not null default false,
  shop_ticket_day text not null default '',
  shop_ticket_buys int not null default 0,
  updated_at timestamptz default now()
);

alter table public.world_boss enable row level security;
alter table public.world_boss_participants enable row level security;
alter table public.world_boss_tickets enable row level security;

drop policy if exists "public world boss read/write" on public.world_boss;
drop policy if exists "public world boss participants read/write" on public.world_boss_participants;
drop policy if exists "public world boss tickets read/write" on public.world_boss_tickets;

create policy "world boss read only"
on public.world_boss
for select
using (true);

create policy "world boss participants read only"
on public.world_boss_participants
for select
using (true);

create policy "world boss tickets read only"
on public.world_boss_tickets
for select
using (true);

drop table if exists public.withdrawals;

create table if not exists public.seasons (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  pool_usdt numeric not null default 0,
  status text not null default 'active',
  closed_at timestamptz,
  created_at timestamptz default now(),
  check (pool_usdt >= 0),
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
  payout_usdt numeric not null default 0,
  excluded boolean not null default false,
  exclude_reason text not null default '',
  created_at timestamptz default now(),
  unique (season_id, wallet),
  check (crystals_snapshot >= 0),
  check (effective_crystals >= 0),
  check (share >= 0),
  check (payout_usdt >= 0)
);

create index if not exists seasons_status_idx on public.seasons(status, start_at desc);
create index if not exists season_snapshots_season_idx on public.season_snapshots(season_id);
create index if not exists season_snapshots_season_effective_idx on public.season_snapshots(season_id, effective_crystals desc);
create index if not exists season_snapshots_season_payout_usdt_idx on public.season_snapshots(season_id, payout_usdt desc);

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

create table if not exists public.security_events (
  id uuid primary key default gen_random_uuid(),
  wallet text not null,
  kind text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz default now()
);

alter table public.security_events enable row level security;

create table if not exists public.blocked_wallets (
  wallet text primary key,
  reason text not null default 'Cheating',
  blocked_by text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.blocked_wallets enable row level security;

create table if not exists public.referrals (
  referrer_wallet text not null,
  referee_wallet text primary key,
  level_bonus_claimed boolean not null default false,
  last_referee_crystals bigint not null default 0,
  pending_keys bigint not null default 0,
  pending_crystals bigint not null default 0,
  claimed_keys bigint not null default 0,
  claimed_crystals bigint not null default 0,
  crystals_earned bigint not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  check (referrer_wallet <> referee_wallet)
);

alter table public.referrals add column if not exists pending_keys bigint not null default 0;
alter table public.referrals add column if not exists pending_crystals bigint not null default 0;
alter table public.referrals add column if not exists claimed_keys bigint not null default 0;
alter table public.referrals add column if not exists claimed_crystals bigint not null default 0;

create index if not exists referrals_referrer_wallet_idx on public.referrals(referrer_wallet);

alter table public.referrals enable row level security;

drop policy if exists "public referrals read/write" on public.referrals;

create policy "referrals read only"
on public.referrals
for select
using (true);

create table if not exists public.wallet_auth_nonces (
  wallet text primary key,
  nonce text not null,
  message text not null,
  expires_at timestamptz not null,
  updated_at timestamptz default now()
);

create table if not exists public.wallet_sessions (
  token text primary key,
  wallet text not null,
  expires_at timestamptz not null,
  updated_at timestamptz default now()
);

create index if not exists wallet_sessions_wallet_idx on public.wallet_sessions(wallet);
create index if not exists wallet_sessions_expires_at_idx on public.wallet_sessions(expires_at);

create table if not exists public.dungeon_state (
  wallet text primary key,
  tickets int not null default 5,
  ticket_day text not null,
  dungeon_runs bigint not null default 0,
  shop_key_day text not null default '',
  shop_key_buys int not null default 0,
  updated_at timestamptz default now()
);

alter table public.dungeon_state alter column tickets set default 5;
alter table public.world_boss_tickets add column if not exists shop_ticket_day text not null default '';
alter table public.world_boss_tickets add column if not exists shop_ticket_buys int not null default 0;
alter table public.dungeon_state add column if not exists shop_key_day text not null default '';
alter table public.dungeon_state add column if not exists shop_key_buys int not null default 0;

create table if not exists public.fortune_state (
  wallet text primary key,
  free_spin_day text not null default '',
  paid_spins int not null default 0,
  updated_at timestamptz default now()
);

drop table if exists public.crypto_payments;


alter table public.wallet_auth_nonces enable row level security;
alter table public.wallet_sessions enable row level security;
alter table public.dungeon_state enable row level security;
alter table public.fortune_state enable row level security;

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
