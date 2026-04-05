alter table public.crypto_payments add column if not exists treasury_address text not null default '';
alter table public.crypto_payments add column if not exists tx_hash text not null default '';
alter table public.crypto_payments add column if not exists expires_at timestamptz;
alter table public.crypto_payments add column if not exists detected_at timestamptz;

create index if not exists crypto_payments_provider_currency_idx
on public.crypto_payments(provider, pay_currency, created_at desc);

create index if not exists crypto_payments_tx_hash_idx
on public.crypto_payments(tx_hash)
where tx_hash <> '';
