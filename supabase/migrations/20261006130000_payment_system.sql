create table if not exists public.payment_gateway_settings (
  id integer primary key default 1,
  merchant_name text not null default 'merchant_store_name',
  merchant_phone text not null default 'merchant_phone_number',
  currency text not null default 'SAR',
  ignore_descriptor_validation boolean not null default true,
  updated_at timestamptz not null default now(),
  constraint payment_gateway_settings_single_row check (id = 1)
);

insert into public.payment_gateway_settings (
  id,
  merchant_name,
  merchant_phone,
  currency,
  ignore_descriptor_validation
)
values (
  1,
  'merchant_store_name',
  'merchant_phone_number',
  'SAR',
  true
)
on conflict (id) do nothing;

create table if not exists public.payment_transactions (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null references auth.users(id) on delete cascade,
  office_id uuid not null references public.offices(id) on delete cascade,
  package_id uuid not null references public.package_catalog(id),

  checkout_id text unique,
  merchant_transaction_id text not null unique,
  gateway_transaction_id text,

  amount numeric(12,2) not null,
  currency text not null default 'SAR',

  status text not null default 'pending'
    check (status in ('pending','success','failed','cancelled')),

  payment_type text,
  payment_brand text,
  result_code text,
  result_description text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  paid_at timestamptz
);

alter table public.payment_gateway_settings enable row level security;
alter table public.payment_transactions enable row level security;

drop policy if exists payment_settings_admin_select
on public.payment_gateway_settings;

create policy payment_settings_admin_select
on public.payment_gateway_settings
for select
to authenticated
using (public.is_admin());

drop policy if exists payment_settings_admin_update
on public.payment_gateway_settings;

create policy payment_settings_admin_update
on public.payment_gateway_settings
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists payment_transactions_owner_select
on public.payment_transactions;

create policy payment_transactions_owner_select
on public.payment_transactions
for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_admin()
);

drop policy if exists payment_transactions_admin_select
on public.payment_transactions;

create policy payment_transactions_admin_select
on public.payment_transactions
for select
to authenticated
using (public.is_admin());

create index if not exists payment_transactions_user_idx
on public.payment_transactions(user_id);

create index if not exists payment_transactions_office_idx
on public.payment_transactions(office_id);

create index if not exists payment_transactions_status_idx
on public.payment_transactions(status);

create index if not exists payment_transactions_created_idx
on public.payment_transactions(created_at desc);
