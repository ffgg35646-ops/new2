begin;

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
  offer_number integer;
begin
  select
    oo.id,
    oo.office_id,
    oo.request_id,
    oo.created_at,
    o.name as office_name,
    pr.user_id
  into offer_row
  from public.office_offers oo
  join public.offices o on o.id = oo.office_id
  join public.property_requests pr on pr.id = oo.request_id
  where oo.id = _offer_id;

  if not found then
    raise exception 'offer_not_found';
  end if;

  if public.office_member_office_id() is null
     or public.office_member_office_id() <> offer_row.office_id then
    raise exception 'not_office_member';
  end if;

  select coalesce(
    max(substring(n.title from '^طلب مستلم جديد ([0-9]+)

  insert into public.notifications (
    user_id,
    title,
    body,
    type,
    link,
    is_read
  )
  values (
    offer_row.user_id,
    'طلب مستلم جديد ' || coalesce(offer_number, 1)::text,
    'أرسل لك ' || coalesce(offer_row.office_name, 'مكتب عقاري') || ' عرضًا على طلبك العقاري.',
    'property_offer',
    '/requests?tab=received&offer=' || offer_row.id::text,
    false
  );
end;
$$;

-- Avoid an additional legacy trigger notification alongside the explicit RPC call.
drop trigger if exists trg_notify_property_request_offer
on public.office_offers;

revoke all
on function public.notify_new_property_offer(uuid)
from public;

grant execute
on function public.notify_new_property_offer(uuid)
to authenticated;

commit;
)::integer),
    0
  ) + 1
  into offer_number
  from public.notifications n
  where n.user_id = offer_row.user_id
    and n.title ~ '^طلب مستلم جديد [0-9]+

  insert into public.notifications (
    user_id,
    title,
    body,
    type,
    link,
    is_read
  )
  values (
    offer_row.user_id,
    'طلب مستلم جديد ' || coalesce(offer_number, 1)::text,
    'أرسل لك ' || coalesce(offer_row.office_name, 'مكتب عقاري') || ' عرضًا على طلبك العقاري.',
    'property_offer',
    '/requests?tab=received&offer=' || offer_row.id::text,
    false
  );
end;
$$;

-- Avoid an additional legacy trigger notification alongside the explicit RPC call.
drop trigger if exists trg_notify_property_request_offer
on public.office_offers;

revoke all
on function public.notify_new_property_offer(uuid)
from public;

grant execute
on function public.notify_new_property_offer(uuid)
to authenticated;

commit;
;

  insert into public.notifications (
    user_id,
    title,
    body,
    type,
    link,
    is_read
  )
  values (
    offer_row.user_id,
    'طلب مستلم جديد ' || coalesce(offer_number, 1)::text,
    'أرسل لك ' || coalesce(offer_row.office_name, 'مكتب عقاري') || ' عرضًا على طلبك العقاري.',
    'property_offer',
    '/requests?tab=received&offer=' || offer_row.id::text,
    false
  );
end;
$$;

-- Avoid an additional legacy trigger notification alongside the explicit RPC call.
drop trigger if exists trg_notify_property_request_offer
on public.office_offers;

revoke all
on function public.notify_new_property_offer(uuid)
from public;

grant execute
on function public.notify_new_property_offer(uuid)
to authenticated;

commit;
