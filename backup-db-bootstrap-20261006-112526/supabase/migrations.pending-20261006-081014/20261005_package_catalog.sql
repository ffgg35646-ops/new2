create table if not exists public.package_catalog (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price numeric(12,2) not null default 0,
  duration_days integer not null default 30,
  features jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.package_catalog enable row level security;

drop policy if exists "package_catalog_public_read" on public.package_catalog;
create policy "package_catalog_public_read"
on public.package_catalog
for select
to authenticated
using (is_active = true or public.is_admin());

drop policy if exists "package_catalog_admin_insert" on public.package_catalog;
create policy "package_catalog_admin_insert"
on public.package_catalog
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "package_catalog_admin_update" on public.package_catalog;
create policy "package_catalog_admin_update"
on public.package_catalog
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "package_catalog_admin_delete" on public.package_catalog;
create policy "package_catalog_admin_delete"
on public.package_catalog
for delete
to authenticated
using (public.is_admin());

create or replace function public.touch_package_catalog_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_package_catalog_updated_at
on public.package_catalog;

create trigger trg_package_catalog_updated_at
before update on public.package_catalog
for each row
execute function public.touch_package_catalog_updated_at();

insert into public.package_catalog
  (name, description, price, duration_days, features, is_active, sort_order)
select
  'الباقة المجانية',
  'الباقة الأساسية للمكاتب العقارية',
  0,
  0,
  '["إنشاء صفحة خاصة بالمكتب","الظهور في قسم المكاتب العقارية","إضافة حتى 5 عقارات","استقبال المتابعين والتقييمات","اتصال وواتساب","مشاركة صفحة المكتب","إحصائيات أساسية"]'::jsonb,
  true,
  1
where not exists (
  select 1 from public.package_catalog where name = 'الباقة المجانية'
);

insert into public.package_catalog
  (name, description, price, duration_days, features, is_active, sort_order)
select
  'الباقة الاحترافية',
  'الباقة الاحترافية للمكاتب العقارية',
  199,
  30,
  '["عقارات غير محدودة","توثيق المكتب ✓","دردشة خاصة ومستقلة مع كل عميل","إرسال الصور داخل المحادثة","معرفة العقار الذي يستفسر عنه العميل","رمز QR للمكتب والعقار","تمييز حتى 3 عقارات","أولوية الظهور","كل مميزات الباقة المجانية"]'::jsonb,
  true,
  2
where not exists (
  select 1 from public.package_catalog where name = 'الباقة الاحترافية'
);
