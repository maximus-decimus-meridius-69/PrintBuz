insert into storage.buckets (id, name, public)
values ('posters', 'posters', true)
on conflict (id) do nothing;

create table if not exists public.poster_orders (
  id uuid primary key,
  event text not null default 'ceer',
  roll_number text not null,
  department text not null,
  year text not null,
  course text not null,
  email text not null,
  section text not null,
  amount integer not null,
  status text not null default 'pending',
  downloaded boolean not null default false,
  downloaded_at timestamptz,
  downloaded_by text,
  print_done boolean not null default false,
  poster_path text,
  poster_url text,
  razorpay_order_id text,
  razorpay_payment_id text,
  payment_verified_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.poster_orders add column if not exists event text not null default 'ceer';
alter table public.poster_orders add column if not exists downloaded boolean not null default false;
alter table public.poster_orders add column if not exists downloaded_at timestamptz;
alter table public.poster_orders add column if not exists downloaded_by text;
alter table public.poster_orders add column if not exists print_done boolean not null default false;

create table if not exists public.azura_orders (
  id uuid primary key,
  name text not null,
  phone text not null,
  email text not null,
  width integer not null default 6,
  height integer not null,
  gdrive_url text not null,
  amount integer not null,
  status text not null default 'pending',
  print_done boolean not null default false,
  razorpay_order_id text,
  razorpay_payment_id text,
  payment_verified_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.poster_orders enable row level security;
alter table public.azura_orders enable row level security;

drop policy if exists "Allow inserts from server role" on public.poster_orders;
create policy "Allow inserts from server role"
on public.poster_orders
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

drop policy if exists "Allow service role access to azura orders" on public.azura_orders;
create policy "Allow service role access to azura orders"
on public.azura_orders
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

drop policy if exists "Public bucket read access" on storage.objects;
create policy "Public bucket read access"
on storage.objects
for select
to public
using (bucket_id = 'posters');