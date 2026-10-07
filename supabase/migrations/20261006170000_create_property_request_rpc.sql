-- Create property requests through a SECURITY DEFINER function.
-- This avoids direct PostgREST INSERT permission/RLS failures while
-- still enforcing that the request belongs to the authenticated user.

create or replace function public.create_property_request(
  _governorate_id uuid,
  _kind public.property_kind,
  _listing public.listing_type,
  _neighborhood text default null,
  _budget_min numeric default null,
  _budget_max numeric default null,
  _area_min numeric default null,
  _description text default null,
  _attachment_url text default null,
  _expires_at timestamptz default null
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_request_id uuid;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  if not exists (
    select 1
    from public.governorates g
    where g.id = _governorate_id
      and g.is_active = true
  ) then
    raise exception 'governorate_inactive';
  end if;

  if length(trim(coalesce(_description, ''))) < 10 then
    raise exception 'description_required';
  end if;

  if _budget_min is not null
     and _budget_max is not null
     and _budget_min > _budget_max then
    raise exception 'invalid_budget_range';
  end if;

  if _budget_min is not null and _budget_min < 0 then
    raise exception 'invalid_budget';
  end if;

  if _budget_max is not null and _budget_max < 0 then
    raise exception 'invalid_budget';
  end if;

  if _area_min is not null and _area_min < 0 then
    raise exception 'invalid_area';
  end if;

  insert into public.property_requests (
    user_id,
    governorate_id,
    kind,
    listing,
    neighborhood,
    budget_min,
    budget_max,
    area_min,
    description,
    attachment_url,
    expires_at
  )
  values (
    v_uid,
    _governorate_id,
    _kind,
    _listing,
    nullif(trim(coalesce(_neighborhood, '')), ''),
    _budget_min,
    _budget_max,
    _area_min,
    trim(_description),
    nullif(trim(coalesce(_attachment_url, '')), ''),
    coalesce(_expires_at, now() + interval '7 days')
  )
  returning id into v_request_id;

  return v_request_id;
end;
$$;

revoke all
on function public.create_property_request(
  uuid,
  public.property_kind,
  public.listing_type,
  text,
  numeric,
  numeric,
  numeric,
  text,
  text,
  timestamptz
)
from public;

grant execute
on function public.create_property_request(
  uuid,
  public.property_kind,
  public.listing_type,
  text,
  numeric,
  numeric,
  numeric,
  text,
  text,
  timestamptz
)
to authenticated;
