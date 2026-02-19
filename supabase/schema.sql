create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  wallet text primary key,
  state jsonb not null,
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

drop policy if exists "public read/write" on public.profiles;

create policy "profiles read only"
on public.profiles
for select
using (true);

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

create table if not exists public.withdrawals (
  id uuid primary key default gen_random_uuid(),
  wallet text not null,
  name text not null,
  crystals int not null,
  sol_amount numeric not null,
  status text not null default 'pending',
  created_at timestamptz default now()
);

alter table public.withdrawals enable row level security;

drop policy if exists "public withdrawals read/write" on public.withdrawals;

create policy "withdrawals read only"
on public.withdrawals
for select
using (true);

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
  updated_at timestamptz default now()
);

alter table public.dungeon_state alter column tickets set default 5;

create table if not exists public.fortune_state (
  wallet text primary key,
  free_spin_day text not null default '',
  paid_spins int not null default 0,
  updated_at timestamptz default now()
);

alter table public.wallet_auth_nonces enable row level security;
alter table public.wallet_sessions enable row level security;
alter table public.dungeon_state enable row level security;
alter table public.fortune_state enable row level security;
