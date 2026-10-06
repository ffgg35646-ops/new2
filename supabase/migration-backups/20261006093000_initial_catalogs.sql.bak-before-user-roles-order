-- =========================================================
-- عقار البطين - قاعدة بيانات جديدة
-- المحافظات + الباقات
-- =========================================================

-- ---------------------------------------------------------
-- Helper: admin check
-- ---------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and role = 'admin'
  );
$$;

grant execute on function public.is_admin() to anon, authenticated;


-- =========================================================
-- GOVERNORATES
-- =========================================================
create table if not exists public.governorates (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null,
  name_en text,
  code text not null unique,
  banner_url text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.governorates enable row level security;

grant select on public.governorates to anon, authenticated;
grant insert, update, delete on public.governorates to authenticated;

drop policy if exists "governorates_public_read_active" on public.governorates;

create policy "governorates_public_read_active"
on public.governorates
for select
to anon, authenticated
using (
  is_active = true
  or public.is_admin()
);

drop policy if exists "governorates_admin_insert" on public.governorates;

create policy "governorates_admin_insert"
on public.governorates
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "governorates_admin_update" on public.governorates;

create policy "governorates_admin_update"
on public.governorates
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "governorates_admin_delete" on public.governorates;

create policy "governorates_admin_delete"
on public.governorates
for delete
to authenticated
using (public.is_admin());


-- updated_at للمحافظات
create or replace function public.touch_governorates_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_governorates_updated_at
on public.governorates;

create trigger trg_governorates_updated_at
before update on public.governorates
for each row
execute function public.touch_governorates_updated_at();


-- =========================================================
-- المحافظتان الموجودة فعليًا في واجهة عقار البطين
-- =========================================================
insert into public.governorates
  (name_ar, name_en, code, is_active, sort_order)
values
  ('المزاحمية', 'Al Muzahimiyah', 'MUZAHMIYAH', true, 1),
  ('ضرما', 'Dhurma', 'DHURMA', true, 2)
on conflict (code) do update
set
  name_ar = excluded.name_ar,
  name_en = excluded.name_en,
  is_active = excluded.is_active,
  sort_order = excluded.sort_order,
  updated_at = now();


-- =========================================================
-- PACKAGE CATALOG
-- =========================================================
create table if not exists public.package_catalog (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  price numeric(12,2) not null default 0,
  duration_days integer not null default 0,
  property_limit integer,
  chat_enabled boolean not null default false,
  featured_limit integer not null default 0,
  verification_included boolean not null default false,
  features jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint package_catalog_price_check
    check (price >= 0),

  constraint package_catalog_duration_check
    check (duration_days >= 0),

  constraint package_catalog_property_limit_check
    check (property_limit is null or property_limit >= 0),

  constraint package_catalog_featured_limit_check
    check (featured_limit >= 0)
);

alter table public.package_catalog enable row level security;

grant select on public.package_catalog to anon, authenticated;
grant insert, update, delete on public.package_catalog to authenticated;

drop policy if exists "package_catalog_public_read_active"
on public.package_catalog;

create policy "package_catalog_public_read_active"
on public.package_catalog
for select
to anon, authenticated
using (
  is_active = true
  or public.is_admin()
);

drop policy if exists "package_catalog_admin_insert"
on public.package_catalog;

create policy "package_catalog_admin_insert"
on public.package_catalog
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "package_catalog_admin_update"
on public.package_catalog;

create policy "package_catalog_admin_update"
on public.package_catalog
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "package_catalog_admin_delete"
on public.package_catalog;

create policy "package_catalog_admin_delete"
on public.package_catalog
for delete
to authenticated
using (public.is_admin());


-- updated_at للباقات
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


-- =========================================================
-- الباقات الموجودة فعليًا في مشروع عقار البطين
-- =========================================================
insert into public.package_catalog
(
  code,
  name,
  description,
  price,
  duration_days,
  property_limit,
  chat_enabled,
  featured_limit,
  verification_included,
  features,
  is_active,
  sort_order
)
values
(
  'free',
  'الباقة المجانية',
  'الباقة الأساسية للمكاتب العقارية',
  0,
  0,
  5,
  false,
  0,
  false,
  '[
    "إنشاء صفحة خاصة بالمكتب",
    "الظهور في قسم المكاتب العقارية",
    "إضافة حتى 5 عقارات",
    "استقبال المتابعين والتقييمات",
    "اتصال وواتساب",
    "مشاركة صفحة المكتب",
    "إحصائيات أساسية"
  ]'::jsonb,
  true,
  1
),
(
  'pro',
  'الباقة الاحترافية',
  'الباقة الاحترافية للمكاتب العقارية',
  199,
  30,
  null,
  true,
  3,
  true,
  '[
    "عقارات غير محدودة",
    "توثيق المكتب ✓",
    "دردشة خاصة ومستقلة مع كل عميل",
    "إرسال الصور داخل المحادثة",
    "معرفة العقار الذي يستفسر عنه العميل",
    "رمز QR للمكتب والعقار",
    "تمييز حتى 3 عقارات",
    "أولوية ظهور المكتب",
    "كل مميزات الباقة المجانية"
  ]'::jsonb,
  true,
  2
)
on conflict (code) do update
set
  name = excluded.name,
  description = excluded.description,
  price = excluded.price,
  duration_days = excluded.duration_days,
  property_limit = excluded.property_limit,
  chat_enabled = excluded.chat_enabled,
  featured_limit = excluded.featured_limit,
  verification_included = excluded.verification_included,
  features = excluded.features,
  is_active = excluded.is_active,
  sort_order = excluded.sort_order,
  updated_at = now();
