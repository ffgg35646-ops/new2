------------------------------------------------------------
-- DYNAMIC PACKAGE SYSTEM
------------------------------------------------------------

create table if not exists public.package_catalog (
  id uuid primary key default gen_random_uuid(),
  code text,
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
  updated_at timestamptz not null default now()
);

alter table public.package_catalog
  add column if not exists code text;

alter table public.package_catalog
  add column if not exists property_limit integer;

alter table public.package_catalog
  add column if not exists chat_enabled boolean not null default false;

alter table public.package_catalog
  add column if not exists featured_limit integer not null default 0;

alter table public.package_catalog
  add column if not exists verification_included boolean not null default false;

update public.package_catalog
set code = 'free'
where code is null
  and lower(name) like '%مجانية%';

update public.package_catalog
set code = 'pro'
where code is null
  and lower(name) like '%احتراف%';

update public.package_catalog
set property_limit = 5
where code = 'free'
  and property_limit is null;

update public.package_catalog
set property_limit = null,
    chat_enabled = true,
    featured_limit = 3,
    verification_included = true
where code = 'pro';

create unique index if not exists package_catalog_code_unique
on public.package_catalog(code)
where code is not null;

alter table public.package_catalog
  drop constraint if exists package_catalog_property_limit_check;

alter table public.package_catalog
  add constraint package_catalog_property_limit_check
  check (property_limit is null or property_limit >= 0);

alter table public.package_catalog
  drop constraint if exists package_catalog_duration_check;

alter table public.package_catalog
  add constraint package_catalog_duration_check
  check (duration_days >= 0);


------------------------------------------------------------
-- Seed old packages
------------------------------------------------------------

insert into public.package_catalog
  (code,name,description,price,duration_days,property_limit,
   chat_enabled,featured_limit,verification_included,features,is_active,sort_order)
select
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
where not exists (
  select 1 from public.package_catalog where code = 'free'
);

insert into public.package_catalog
  (code,name,description,price,duration_days,property_limit,
   chat_enabled,featured_limit,verification_included,features,is_active,sort_order)
select
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
where not exists (
  select 1 from public.package_catalog where code = 'pro'
);


------------------------------------------------------------
-- Existing offices get package_id
------------------------------------------------------------

alter table public.offices
  add column if not exists package_id uuid;

update public.offices o
set package_id = p.id
from public.package_catalog p
where o.package_id is null
  and (
    (o.plan = 'free' and p.code = 'free')
    or
    (o.plan = 'pro' and p.code = 'pro')
  );

update public.offices
set package_id = (select id from public.package_catalog where code = 'free')
where package_id is null;

alter table public.offices
  alter column package_id set not null;

alter table public.offices
  drop constraint if exists offices_package_id_fkey;

alter table public.offices
  add constraint offices_package_id_fkey
  foreign key (package_id)
  references public.package_catalog(id)
  on delete restrict;

create index if not exists offices_package_id_idx
on public.offices(package_id);


------------------------------------------------------------
-- RLS package catalog
------------------------------------------------------------

alter table public.package_catalog enable row level security;

drop policy if exists "package_catalog_public_read" on public.package_catalog;
create policy "package_catalog_public_read"
on public.package_catalog
for select
to authenticated
using (
  is_active = true
  or public.is_admin()
);

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


------------------------------------------------------------
-- updated_at
------------------------------------------------------------

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


------------------------------------------------------------
-- Owner changes package
------------------------------------------------------------

create or replace function public.set_office_package(
  _package_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _office_id uuid;
  _package public.package_catalog%rowtype;
  _legacy_plan public.office_plan;
  _expires timestamptz;
begin
  select id
  into _office_id
  from public.offices
  where owner_id = auth.uid()
    and is_deleted = false
  limit 1;

  if _office_id is null then
    raise exception 'office_not_found';
  end if;

  select *
  into _package
  from public.package_catalog
  where id = _package_id
    and is_active = true;

  if not found then
    raise exception 'package_not_available';
  end if;

  _legacy_plan :=
    case
      when _package.code = 'pro' or _package.price > 0
        then 'pro'::public.office_plan
      else 'free'::public.office_plan
    end;

  if _package.duration_days > 0 then
    _expires := now() + make_interval(days => _package.duration_days);
  else
    _expires := null;
  end if;

  update public.offices
  set
    package_id = _package.id,
    plan = _legacy_plan,
    plan_started_at = now(),
    plan_expires_at = _expires,
    updated_at = now()
  where id = _office_id;

  insert into public.office_plan_events
    (office_id, action, plan, expires_at, note)
  values
    (
      _office_id,
      'package_changed',
      _legacy_plan,
      _expires,
      _package.name
    );
end;
$$;


------------------------------------------------------------
-- Admin changes package
------------------------------------------------------------

create or replace function public.admin_set_office_package(
  _office_id uuid,
  _package_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _package public.package_catalog%rowtype;
  _legacy_plan public.office_plan;
  _expires timestamptz;
begin
  if not public.is_admin() then
    raise exception 'admin_only';
  end if;

  select *
  into _package
  from public.package_catalog
  where id = _package_id;

  if not found then
    raise exception 'package_not_found';
  end if;

  _legacy_plan :=
    case
      when _package.code = 'pro' or _package.price > 0
        then 'pro'::public.office_plan
      else 'free'::public.office_plan
    end;

  if _package.duration_days > 0 then
    _expires := now() + make_interval(days => _package.duration_days);
  else
    _expires := null;
  end if;

  update public.offices
  set
    package_id = _package.id,
    plan = _legacy_plan,
    plan_started_at = now(),
    plan_expires_at = _expires,
    updated_at = now()
  where id = _office_id
    and is_deleted = false;

  insert into public.office_plan_events
    (office_id, action, plan, expires_at, note)
  values
    (
      _office_id,
      'admin_package_changed',
      _legacy_plan,
      _expires,
      _package.name
    );
end;
$$;


------------------------------------------------------------
-- Payment backend can activate the selected package securely.
-- This function is NOT callable by normal users.
------------------------------------------------------------

create or replace function public.activate_paid_office_package(
  _user_id uuid,
  _package_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _office_id uuid;
  _package public.package_catalog%rowtype;
  _expires timestamptz;
begin

  select id
  into _office_id
  from public.offices
  where owner_id = _user_id
    and is_deleted = false
  limit 1;

  if _office_id is null then
    raise exception 'office_not_found';
  end if;

  select *
  into _package
  from public.package_catalog
  where id = _package_id
    and is_active = true
    and price > 0;

  if not found then
    raise exception 'paid_package_not_found';
  end if;

  if _package.duration_days > 0 then
    _expires := now() + make_interval(days => _package.duration_days);
  else
    _expires := null;
  end if;

  update public.offices
  set
    package_id = _package.id,
    plan =
      case
        when _package.code = 'pro' or _package.price > 0
          then 'pro'::public.office_plan
        else 'free'::public.office_plan
      end,
    plan_started_at = now(),
    plan_expires_at = _expires,
    updated_at = now()
  where id = _office_id;

  insert into public.office_plan_events
    (office_id, action, plan, expires_at, note)
  values
    (
      _office_id,
      'paid_package_activated',
      case
        when _package.code = 'pro' or _package.price > 0
          then 'pro'::public.office_plan
        else 'free'::public.office_plan
      end,
      _expires,
      _package.name
    );
end;
$$;

revoke all on function public.activate_paid_office_package(uuid, uuid)
from public, anon, authenticated;

grant execute on function public.activate_paid_office_package(uuid, uuid)
to service_role;


------------------------------------------------------------
-- Keep old RPC working for compatibility.
------------------------------------------------------------

create or replace function public.admin_set_office_plan(
  _office_id uuid,
  _plan text,
  _days integer default 30
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _package_id uuid;
begin
  if not public.is_admin() then
    raise exception 'admin_only';
  end if;

  select id
  into _package_id
  from public.package_catalog
  where code = lower(_plan)
  limit 1;

  if _package_id is null then
    raise exception 'package_not_found';
  end if;

  perform public.admin_set_office_package(
    _office_id,
    _package_id
  );
end;
$$;
