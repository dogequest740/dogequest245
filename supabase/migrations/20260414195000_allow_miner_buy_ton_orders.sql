do $$
declare
  existing_constraint text;
begin
  select c.conname
  into existing_constraint
  from pg_constraint c
  where c.conrelid = 'public.telegram_ton_orders'::regclass
    and c.contype = 'c'
    and pg_get_constraintdef(c.oid) ilike '%kind in (''buy_gold'', ''starter_pack_buy'', ''premium_buy'', ''fortune_buy'')%';

  if existing_constraint is not null then
    execute format('alter table public.telegram_ton_orders drop constraint %I', existing_constraint);
  end if;

  if not exists (
    select 1
    from pg_constraint c
    where c.conrelid = 'public.telegram_ton_orders'::regclass
      and c.conname = 'telegram_ton_orders_kind_check'
  ) then
    alter table public.telegram_ton_orders
    add constraint telegram_ton_orders_kind_check
    check (kind in ('buy_gold', 'starter_pack_buy', 'premium_buy', 'fortune_buy', 'miner_buy'));
  end if;
end
$$;