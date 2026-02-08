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
