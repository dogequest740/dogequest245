create table if not exists public.telegram_stars_orders (
  id uuid primary key default gen_random_uuid(),
  wallet text not null,
  tg_user_id text not null,
  kind text not null,
  product_ref text not null default '',
  stars_amount int not null,
  status text not null default 'pending',
  invoice_payload text not null unique,
  invoice_link text not null default '',
  telegram_charge_id text not null default '',
  provider_charge_id text not null default '',
  reward jsonb not null default '{}'::jsonb,
  paid_at timestamptz,
  claimed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  check (stars_amount > 0),
  check (status in ('pending', 'paid', 'claiming', 'claimed', 'expired', 'canceled', 'failed'))
);

create index if not exists telegram_stars_orders_wallet_created_idx on public.telegram_stars_orders(wallet, created_at desc);
create index if not exists telegram_stars_orders_status_created_idx on public.telegram_stars_orders(status, created_at desc);
create index if not exists telegram_stars_orders_payload_idx on public.telegram_stars_orders(invoice_payload);

alter table public.telegram_stars_orders enable row level security;

drop policy if exists "telegram stars no client read" on public.telegram_stars_orders;

create policy "telegram stars no client read"
on public.telegram_stars_orders
for select
using (false);
