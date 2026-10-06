-- طلبات العقارات: مطابقة المكاتب + إشعارات العروض + عدّ مشاهدات المكاتب

create table if not exists public.property_request_views (
  request_id uuid not null references public.property_requests(id) on delete cascade,
  office_id uuid not null references public.offices(id) on delete cascade,
  viewed_at timestamptz not null default now(),
  primary key (request_id, office_id)
);

create index if not exists property_request_views_request_id_idx
  on public.property_request_views(request_id);

alter table public.property_request_views enable row level security;

revoke all on public.property_request_views from public, anon, authenticated;


create or replace function public.notify_matching_offices_for_request(
  _request_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  r record;
begin
  select *
  into r
  from public.property_requests
  where id = _request_id
    and user_id = auth.uid();

  if not found then
    raise exception 'request_not_found';
  end if;

  insert into public.notifications (
    user_id,
    title,
    body,
    type,
    link
  )
  select distinct
    o.owner_id,
    'طلب عقار جديد',
    'يوجد طلب عقاري مطابق لنوع عقارات مكتبك ومنطقتك.',
    'property_request',
    '/office/requests'
  from public.offices o
  join public.properties p
    on p.office_id = o.id
  where o.is_deleted = false
    and o.verification_status = 'verified'
    and p.is_deleted = false
    and p.is_published = true
    and p.governorate_id = r.governorate_id
    and p.kind = r.kind
    and (
      r.neighborhood is null
      or p.neighborhood = r.neighborhood
    );
end;
$$;


create or replace function public.notify_new_property_offer(
  _offer_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  offer_row record;
begin
  select
    oo.id,
    oo.office_id,
    oo.request_id,
    o.name as office_name,
    pr.user_id
  into offer_row
  from public.office_offers oo
  join public.offices o
    on o.id = oo.office_id
  join public.property_requests pr
    on pr.id = oo.request_id
  where oo.id = _offer_id;

  if not found then
    raise exception 'offer_not_found';
  end if;

  if public.office_member_office_id() is null
     or public.office_member_office_id() <> offer_row.office_id then
    raise exception 'not_office_member';
  end if;

  insert into public.notifications (
    user_id,
    title,
    body,
    type,
    link
  )
  values (
    offer_row.user_id,
    'وصل عرض جديد',
    'أرسل لك ' || offer_row.office_name || ' عرضًا على طلبك العقاري.',
    'property_offer',
    '/request'
  );
end;
$$;


create or replace function public.mark_property_request_view(
  _request_id uuid
)
returns integer
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  current_office uuid;
  inserted_count integer;
  new_count integer;
begin
  current_office := public.office_member_office_id();

  if current_office is null then
    raise exception 'not_office_member';
  end if;

  if not exists (
    select 1
    from public.property_requests pr
    where pr.id = _request_id
      and pr.status = 'active'
  ) then
    raise exception 'request_not_active';
  end if;

  insert into public.property_request_views (
    request_id,
    office_id
  )
  values (
    _request_id,
    current_office
  )
  on conflict (request_id, office_id) do nothing;

  get diagnostics inserted_count = row_count;

  if inserted_count = 1 then
    update public.property_requests
    set views_count = coalesce(views_count, 0) + 1,
        updated_at = now()
    where id = _request_id
    returning views_count into new_count;
  else
    select views_count
    into new_count
    from public.property_requests
    where id = _request_id;
  end if;

  return coalesce(new_count, 0);
end;
$$;


revoke all
on function public.notify_matching_offices_for_request(uuid)
from public;

revoke all
on function public.notify_new_property_offer(uuid)
from public;

revoke all
on function public.mark_property_request_view(uuid)
from public;

grant execute
on function public.notify_matching_offices_for_request(uuid)
to authenticated;

grant execute
on function public.notify_new_property_offer(uuid)
to authenticated;

grant execute
on function public.mark_property_request_view(uuid)
to authenticated;
