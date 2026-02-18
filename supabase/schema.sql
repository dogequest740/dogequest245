create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  wallet text primary key,
  state jsonb not null,
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "public read/write"
on public.profiles
for all
using (true)
with check (true);

create table if not exists public.world_boss (
  id int primary key,
  cycle_start timestamptz not null,
  cycle_end timestamptz not null,
  prize_pool int not null default 1000,
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

alter table public.world_boss enable row level security;
alter table public.world_boss_participants enable row level security;

create policy "public world boss read/write"
on public.world_boss
for all
using (true)
with check (true);

create policy "public world boss participants read/write"
on public.world_boss_participants
for all
using (true)
with check (true);

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

create policy "public withdrawals read/write"
on public.withdrawals
for all
using (true)
with check (true);

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
  tickets int not null default 10,
  ticket_day text not null,
  dungeon_runs bigint not null default 0,
  updated_at timestamptz default now()
);

alter table public.wallet_auth_nonces enable row level security;
alter table public.wallet_sessions enable row level security;
alter table public.dungeon_state enable row level security;
