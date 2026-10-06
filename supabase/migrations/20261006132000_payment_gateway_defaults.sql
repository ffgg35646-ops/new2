-- =========================================================
-- عقار البطين - HyperPay gateway settings
-- Non-secret gateway configuration only.
-- Access tokens stay in Supabase Secrets.
-- =========================================================

alter table public.payment_gateway_settings
  add column if not exists provider text not null default 'hyperpay';

alter table public.payment_gateway_settings
  add column if not exists entity_id text;

alter table public.payment_gateway_settings
  add column if not exists environment text not null default 'test'
  check (environment in ('test', 'live'));

update public.payment_gateway_settings
set
  provider = 'hyperpay',
  merchant_name = 'merchant_store_name',
  merchant_phone = 'merchant_phone_number',
  currency = 'SAR',
  entity_id = '8ac7a4caa0b4b25301a0c3df3e950dd7',
  environment = 'test',
  ignore_descriptor_validation = true,
  updated_at = now()
where id = 1;

insert into public.payment_gateway_settings (
  id,
  provider,
  merchant_name,
  merchant_phone,
  currency,
  entity_id,
  environment,
  ignore_descriptor_validation
)
select
  1,
  'hyperpay',
  'merchant_store_name',
  'merchant_phone_number',
  'SAR',
  '8ac7a4caa0b4b25301a0c3df3e950dd7',
  'test',
  true
where not exists (
  select 1
  from public.payment_gateway_settings
  where id = 1
);
