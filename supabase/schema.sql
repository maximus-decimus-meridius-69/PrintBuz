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
  print_done boolean not null default false,
  poster_path text,
  poster_url text,
  razorpay_order_id text,
  razorpay_payment_id text,
  payment_verified_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.poster_orders add column if not exists event text not null default 'ceer';
alter table public.poster_orders add column if not exists print_done boolean not null default false;

alter table public.poster_orders enable row level security;

create policy "Allow inserts from server role"
on public.poster_orders
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

create policy "Public bucket read access"
on storage.objects
for select
to public
using (bucket_id = 'posters');