------------------------------------------------------------
-- Dynamic Governorates for registration
------------------------------------------------------------

alter table public.governorates enable row level security;

drop policy if exists "governorates_public_active_read" on public.governorates;
create policy "governorates_public_active_read"
on public.governorates
for select
to authenticated
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


------------------------------------------------------------
-- Admin can manage neighborhoods too
------------------------------------------------------------

alter table public.neighborhoods enable row level security;

drop policy if exists "neighborhoods_public_active_read" on public.neighborhoods;
create policy "neighborhoods_public_active_read"
on public.neighborhoods
for select
to authenticated
using (
  is_active = true
  or public.is_admin()
);

drop policy if exists "neighborhoods_admin_insert" on public.neighborhoods;
create policy "neighborhoods_admin_insert"
on public.neighborhoods
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "neighborhoods_admin_update" on public.neighborhoods;
create policy "neighborhoods_admin_update"
on public.neighborhoods
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "neighborhoods_admin_delete" on public.neighborhoods;
create policy "neighborhoods_admin_delete"
on public.neighborhoods
for delete
to authenticated
using (public.is_admin());


------------------------------------------------------------
-- New registrations cannot use inactive governorates.
------------------------------------------------------------

create or replace function public.require_active_governorate()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.governorate_id is not null then
    if not exists (
      select 1
      from public.governorates g
      where g.id = new.governorate_id
        and g.is_active = true
    ) then
      raise exception 'governorate_inactive';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_profiles_active_governorate
on public.profiles;

create trigger trg_profiles_active_governorate
before insert or update of governorate_id
on public.profiles
for each row
execute function public.require_active_governorate();

drop trigger if exists trg_offices_active_governorate
on public.offices;

create trigger trg_offices_active_governorate
before insert or update of governorate_id
on public.offices
for each row
execute function public.require_active_governorate();
