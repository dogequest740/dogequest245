create table if not exists public.telegram_notification_state (
  wallet text primary key,
  tg_user_id text not null,
  energy_enabled boolean not null default true,
  world_boss_enabled boolean not null default true,
  last_energy_full_event_ms bigint not null default 0,
  last_world_boss_cycle_start timestamptz,
  delivery_blocked boolean not null default false,
  last_error text not null default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  check (wallet like 'tg:%'),
  check (last_energy_full_event_ms >= 0)
);

create index if not exists telegram_notification_state_tg_user_idx on public.telegram_notification_state(tg_user_id);
create index if not exists telegram_notification_state_blocked_idx on public.telegram_notification_state(delivery_blocked);

alter table public.telegram_notification_state enable row level security;

drop policy if exists "telegram notification state no client read" on public.telegram_notification_state;

create policy "telegram notification state no client read"
on public.telegram_notification_state
for select
using (false);
