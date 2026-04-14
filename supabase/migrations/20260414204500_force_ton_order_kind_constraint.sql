alter table public.telegram_ton_orders
  drop constraint if exists telegram_ton_orders_kind_check;

alter table public.telegram_ton_orders
  add constraint telegram_ton_orders_kind_check
  check (kind in ('buy_gold', 'starter_pack_buy', 'premium_buy', 'fortune_buy', 'miner_buy'));