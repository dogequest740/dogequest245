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
