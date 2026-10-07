begin;

-- =========================================================
-- NOTIFICATIONS RLS
-- =========================================================

alter table public.notifications enable row level security;

drop policy if exists notifications_select_own on public.notifications;
create policy notifications_select_own
on public.notifications
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists notifications_update_own on public.notifications;
create policy notifications_update_own
on public.notifications
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists notifications_delete_own on public.notifications;
create policy notifications_delete_own
on public.notifications
for delete
to authenticated
using (auth.uid() = user_id);

-- =========================================================
-- ADMIN: NEW OFFICE REGISTRATION
-- =========================================================

create or replace function public.notify_admins_about_office()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (
    user_id,
    title,
    body,
    type,
    link,
    is_read
  )
  select
    ur.user_id,
    'طلب تسجيل مكتب جديد',
    'تم تسجيل مكتب جديد باسم ' || coalesce(new.name, 'مكتب عقاري') || ' ويحتاج إلى مراجعة الإدارة.',
    'office_registration',
    '/admin/offices/' || new.id,
    false
  from public.user_roles ur
  where ur.role = 'admin'
    and ur.user_id is not null;

  return new;
end;
$$;

drop trigger if exists trg_notify_admins_about_office
on public.offices;

create trigger trg_notify_admins_about_office
after insert on public.offices
for each row
execute function public.notify_admins_about_office();

-- =========================================================
-- ADMIN: OFFICE APPROVAL / REJECTION
-- =========================================================

create or replace function public.notify_office_verification_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_title text;
  v_body text;
begin
  if old.verification_status is distinct from new.verification_status
     and new.owner_id is not null then

    if new.verification_status = 'verified' then
      v_title := 'تم اعتماد حساب المكتب';
      v_body := 'تم اعتماد مكتبك وأصبح بإمكانك استخدام الحساب.';
    elsif new.verification_status = 'rejected' then
      v_title := 'تم رفض طلب المكتب';
      v_body := 'تم رفض طلب تسجيل المكتب.'
        || case
             when nullif(trim(coalesce(new.rejection_reason, '')), '') is not null
             then ' السبب: ' || trim(new.rejection_reason)
             else ''
           end;
    else
      v_title := 'تحديث حالة المكتب';
      v_body := 'تم تحديث حالة تسجيل مكتبك.';
    end if;

    insert into public.notifications (
      user_id,
      title,
      body,
      type,
      link,
      is_read
    )
    values (
      new.owner_id,
      v_title,
      v_body,
      'office_status',
      '/office/status',
      false
    );
  end if;

  return new;
end;
$$;

drop trigger if exists trg_notify_office_verification_change
on public.offices;

create trigger trg_notify_office_verification_change
after update of verification_status, rejection_reason on public.offices
for each row
execute function public.notify_office_verification_change();

-- =========================================================
-- ADMIN: REPORT
-- =========================================================

create or replace function public.notify_admins_about_report()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reporter_name text;
begin
  select coalesce(p.full_name, 'مستخدم')
  into v_reporter_name
  from public.profiles p
  where p.id = new.reporter_id;

  insert into public.notifications (
    user_id,
    title,
    body,
    type,
    link,
    is_read
  )
  select
    ur.user_id,
    'بلاغ جديد',
    'تم إرسال بلاغ جديد بواسطة ' || v_reporter_name,
    'report',
    '/admin?tab=reports',
    false
  from public.user_roles ur
  where ur.role = 'admin';

  return new;
end;
$$;

drop trigger if exists trg_notify_admins_about_report
on public.reports;

create trigger trg_notify_admins_about_report
after insert on public.reports
for each row
execute function public.notify_admins_about_report();

-- =========================================================
-- SUPPORT: NEW TICKET + REPLY
-- =========================================================

create or replace function public.notify_support_ticket_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (
    user_id,
    title,
    body,
    type,
    link,
    is_read
  )
  select
    ur.user_id,
    'تذكرة دعم جديدة #' || new.ticket_number,
    'تم فتح تذكرة دعم جديدة.',
    'support_ticket',
    '/admin?tab=support',
    false
  from public.user_roles ur
  where ur.role = 'admin';

  return new;
end;
$$;

drop trigger if exists trg_notify_support_ticket_created
on public.support_tickets;

create trigger trg_notify_support_ticket_created
after insert on public.support_tickets
for each row
execute function public.notify_support_ticket_created();


create or replace function public.notify_support_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ticket public.support_tickets%rowtype;
  v_preview text;
  v_count integer;
  v_is_admin boolean;
  v_link text;
begin
  select *
  into v_ticket
  from public.support_tickets
  where id = new.ticket_id;

  if not found then
    return new;
  end if;

  v_is_admin := public.has_role('admin', new.sender_id);

  v_preview :=
    case
      when nullif(trim(coalesce(new.body, '')), '') is not null
        then left(trim(new.body), 120)
      when new.file_url is not null
        then '📎 أرسل ملفًا'
      else
        'رسالة جديدة'
    end;

  select count(*)
  into v_count
  from public.support_messages
  where ticket_id = new.ticket_id;

  if v_is_admin then

    if exists (
      select 1
      from public.user_roles
      where user_id = v_ticket.user_id
        and role = 'office'
    ) then
      v_link := '/office/profile?support=' || v_ticket.id;
    else
      v_link := '/account?support=' || v_ticket.id;
    end if;

    insert into public.notifications (
      user_id,
      title,
      body,
      type,
      link,
      is_read
    )
    values (
      v_ticket.user_id,
      'تم الرد على تذكرتك #' || v_ticket.ticket_number,
      v_preview,
      'support_ticket',
      v_link,
      false
    );

  elsif v_count > 1 then

    insert into public.notifications (
      user_id,
      title,
      body,
      type,
      link,
      is_read
    )
    select
      ur.user_id,
      'رسالة جديدة في التذكرة #' || v_ticket.ticket_number,
      v_preview,
      'support_ticket',
      '/admin?tab=support',
      false
    from public.user_roles ur
    where ur.role = 'admin';

  end if;

  return new;
end;
$$;

drop trigger if exists trg_notify_support_message
on public.support_messages;

create trigger trg_notify_support_message
after insert on public.support_messages
for each row
execute function public.notify_support_message();

-- =========================================================
-- CHAT MESSAGE NOTIFICATIONS
-- =========================================================

create or replace function public.notify_new_chat_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_office_id uuid;
  v_owner_id uuid;
  v_body text;
begin
  select c.user_id, c.office_id
  into v_user_id, v_office_id
  from public.conversations c
  where c.id = new.conversation_id;

  if v_user_id is null or v_office_id is null then
    return new;
  end if;

  v_body :=
    case
      when nullif(trim(coalesce(new.body, '')), '') is not null
        then left(trim(new.body), 120)
      when new.image_url is not null
        then '📷 أرسل صورة'
      else
        'أرسل رسالة جديدة'
    end;

  select o.owner_id
  into v_owner_id
  from public.offices o
  where o.id = v_office_id;

  if new.sender_id = v_user_id then

    if v_owner_id is not null
       and v_owner_id <> new.sender_id then
      insert into public.notifications (
        user_id, title, body, type, link, is_read
      )
      values (
        v_owner_id,
        'رسالة جديدة',
        v_body,
        'chat_message',
        '/office/chat',
        false
      );
    end if;

    insert into public.notifications (
      user_id, title, body, type, link, is_read
    )
    select
      os.user_id,
      'رسالة جديدة',
      v_body,
      'chat_message',
      '/office/chat',
      false
    from public.office_staff os
    where os.office_id = v_office_id
      and os.is_active = true
      and os.user_id is not null
      and os.user_id <> new.sender_id
      and os.user_id <> coalesce(
        v_owner_id,
        '00000000-0000-0000-0000-000000000000'::uuid
      );

  else

    insert into public.notifications (
      user_id, title, body, type, link, is_read
    )
    values (
      v_user_id,
      'رسالة جديدة من المكتب',
      v_body,
      'chat_message',
      '/chats?c=' || new.conversation_id,
      false
    );

  end if;

  return new;
end;
$$;

drop trigger if exists trg_notify_new_chat_message
on public.messages;

create trigger trg_notify_new_chat_message
after insert on public.messages
for each row
execute function public.notify_new_chat_message();

-- =========================================================
-- PROPERTY OFFER -> INDIVIDUAL
-- =========================================================

create or replace function public.notify_property_request_offer()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_office_name text;
begin
  select pr.user_id, o.name
  into v_user_id, v_office_name
  from public.property_requests pr
  join public.offices o on o.id = new.office_id
  where pr.id = new.request_id;

  if v_user_id is not null then
    insert into public.notifications (
      user_id, title, body, type, link, is_read
    )
    values (
      v_user_id,
      'وصل عرض جديد',
      'أرسل ' || coalesce(v_office_name, 'مكتب عقاري') ||
      ' عرضًا على طلبك العقاري.',
      'property_offer',
      '/request',
      false
    );
  end if;

  return new;
end;
$$;

drop trigger if exists trg_notify_property_request_offer
on public.office_offers;

create trigger trg_notify_property_request_offer
after insert on public.office_offers
for each row
execute function public.notify_property_request_offer();

-- =========================================================
-- BOOKING CREATED -> OFFICE
-- =========================================================

create or replace function public.notify_booking_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_property_title text;
  v_owner_id uuid;
begin
  select p.title, o.owner_id
  into v_property_title, v_owner_id
  from public.properties p
  join public.offices o on o.id = p.office_id
  where p.id = new.property_id;

  if v_owner_id is not null then
    insert into public.notifications (
      user_id, title, body, type, link, is_read
    )
    values (
      v_owner_id,
      'حجز معاينة جديد',
      'تم إنشاء حجز معاينة جديد للعقار ' ||
      coalesce(v_property_title, 'العقار') || '.',
      'booking_new',
      '/office',
      false
    );
  end if;

  return new;
end;
$$;

drop trigger if exists trg_notify_booking_created
on public.viewing_bookings;

create trigger trg_notify_booking_created
after insert on public.viewing_bookings
for each row
execute function public.notify_booking_created();

-- =========================================================
-- BOOKING STATUS -> INDIVIDUAL
-- =========================================================

create or replace function public.notify_booking_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_title text;
  v_body text;
  v_property_title text;
begin
  if old.status is distinct from new.status
     and new.status::text in ('accepted', 'rejected') then

    select title
    into v_property_title
    from public.properties
    where id = new.property_id;

    if new.status::text = 'accepted' then
      v_title := 'تم قبول حجز المعاينة';
      v_body := 'تم قبول موعد معاينة ' ||
        coalesce(v_property_title, 'العقار') || '.';
    else
      v_title := 'تم رفض حجز المعاينة';
      v_body := 'تم رفض طلب معاينة ' ||
        coalesce(v_property_title, 'العقار') || '.';
    end if;

    insert into public.notifications (
      user_id, title, body, type, link, is_read
    )
    values (
      new.user_id,
      v_title,
      v_body,
      'booking_status',
      '/request',
      false
    );
  end if;

  return new;
end;
$$;

drop trigger if exists trg_notify_booking_status_change
on public.viewing_bookings;

create trigger trg_notify_booking_status_change
after update of status on public.viewing_bookings
for each row
execute function public.notify_booking_status_change();

-- =========================================================
-- PROPERTY INQUIRY -> OFFICE
-- =========================================================

create or replace function public.notify_property_inquiry_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_property_title text;
  v_owner_id uuid;
begin
  select p.title, o.owner_id
  into v_property_title, v_owner_id
  from public.properties p
  join public.offices o on o.id = p.office_id
  where p.id = new.property_id;

  if v_owner_id is not null then
    insert into public.notifications (
      user_id, title, body, type, link, is_read
    )
    values (
      v_owner_id,
      'طلب جديد على عقارك',
      'وصل استفسار/طلب جديد على ' ||
      coalesce(v_property_title, 'عقار'),
      'property_inquiry',
      '/office',
      false
    );
  end if;

  return new;
end;
$$;

drop trigger if exists trg_notify_property_inquiry_created
on public.property_inquiries;

create trigger trg_notify_property_inquiry_created
after insert on public.property_inquiries
for each row
execute function public.notify_property_inquiry_created();

-- =========================================================
-- SAVED SEARCH MATCH
-- =========================================================

create or replace function public.notify_matching_saved_searches()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  saved record;
  filters jsonb;
  matched boolean;
begin
  for saved in
    select user_id, filters
    from public.saved_searches
    where notify = true
  loop
    filters := coalesce(saved.filters::jsonb, '{}'::jsonb);
    matched := true;

    if filters ? 'governorateId'
       and nullif(filters->>'governorateId', '') is not null
       and filters->>'governorateId' <> new.governorate_id::text then
      matched := false;
    end if;

    if matched and filters ? 'kind'
       and nullif(filters->>'kind', '') is not null
       and filters->>'kind' <> new.kind::text then
      matched := false;
    end if;

    if matched and filters ? 'listing'
       and nullif(filters->>'listing', '') is not null
       and filters->>'listing' <> new.listing::text then
      matched := false;
    end if;

    if matched and filters ? 'neighborhood'
       and nullif(filters->>'neighborhood', '') is not null
       and filters->>'neighborhood' <> coalesce(new.neighborhood, '') then
      matched := false;
    end if;

    if matched and nullif(filters->>'minPrice', '') is not null
       and new.price < (filters->>'minPrice')::numeric then
      matched := false;
    end if;

    if matched and nullif(filters->>'maxPrice', '') is not null
       and new.price > (filters->>'maxPrice')::numeric then
      matched := false;
    end if;

    if matched and nullif(filters->>'minArea', '') is not null
       and new.area < (filters->>'minArea')::numeric then
      matched := false;
    end if;

    if matched and nullif(filters->>'maxArea', '') is not null
       and new.area > (filters->>'maxArea')::numeric then
      matched := false;
    end if;

    if matched and nullif(filters->>'rooms', '') is not null
       and (
         new.rooms is null
         or new.rooms < (filters->>'rooms')::numeric
       ) then
      matched := false;
    end if;

    if matched and nullif(filters->>'search', '') is not null
       and (
         new.title not ilike '%' || (filters->>'search') || '%'
         and coalesce(new.neighborhood, '') not ilike '%' ||
             (filters->>'search') || '%'
       ) then
      matched := false;
    end if;

    if matched then
      insert into public.notifications (
        user_id, title, body, type, link, is_read
      )
      values (
        saved.user_id,
        'عقار جديد مطابق لبحثك',
        'تمت إضافة عقار جديد يطابق الشروط التي حفظتها.',
        'saved_search_match',
        '/properties/' || new.property_number,
        false
      );
    end if;
  end loop;

  return new;
end;
$$;

drop trigger if exists trg_notify_matching_saved_searches
on public.properties;

create trigger trg_notify_matching_saved_searches
after insert on public.properties
for each row
when (
  new.is_published = true
  and new.is_deleted = false
)
execute function public.notify_matching_saved_searches();

-- =========================================================
-- FAVORITE PRICE DROP
-- =========================================================

create or replace function public.notify_favorite_price_drop()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  favorite_user uuid;
begin
  if old.price is distinct from new.price
     and new.price < old.price
     and new.is_published = true
     and new.is_deleted = false then

    for favorite_user in
      select user_id
      from public.favorites
      where property_id = new.id
    loop
      insert into public.notifications (
        user_id, title, body, type, link, is_read
      )
      values (
        favorite_user,
        'انخفض سعر عقار محفوظ',
        'انخفض سعر العقار ' ||
        coalesce(new.title, new.property_number) ||
        ' من ' ||
        to_char(old.price, 'FM999G999G999G990') ||
        ' إلى ' ||
        to_char(new.price, 'FM999G999G999G990') ||
        ' ر.س.',
        'price_drop',
        '/properties/' || new.property_number,
        false
      );
    end loop;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_notify_favorite_price_drop
on public.properties;

create trigger trg_notify_favorite_price_drop
after update of price on public.properties
for each row
execute function public.notify_favorite_price_drop();

-- =========================================================
-- PROPERTY REQUEST -> MATCHING OFFICES
-- =========================================================

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
    user_id, title, body, type, link, is_read
  )
  select distinct
    o.owner_id,
    'طلب عقار جديد',
    'يوجد طلب عقاري مطابق لنوع عقارات مكتبك ومنطقتك.',
    'property_request',
    '/office/requests',
    false
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

grant execute
on function public.notify_matching_offices_for_request(uuid)
to authenticated;

-- =========================================================
-- ADMIN SEND NOTIFICATIONS
-- =========================================================

create or replace function public.admin_send_notifications(
  _user_ids uuid[],
  _title text,
  _body text,
  _type text default 'admin_message',
  _link text default '/notifications'
)
returns integer
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  sent_count integer;
  safe_link text;
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;

  if coalesce(array_length(_user_ids, 1), 0) = 0 then
    raise exception 'no_recipients';
  end if;

  safe_link :=
    case
      when coalesce(_link, '') like '/%' then _link
      else '/notifications'
    end;

  insert into public.notifications (
    user_id, title, body, type, link, is_read
  )
  select distinct
    recipient_id,
    trim(_title),
    trim(_body),
    coalesce(nullif(trim(_type), ''), 'admin_message'),
    safe_link,
    false
  from unnest(_user_ids) as recipient_id
  where recipient_id is not null;

  get diagnostics sent_count = row_count;
  return sent_count;
end;
$$;

revoke all
on function public.admin_send_notifications(uuid[], text, text, text, text)
from public;

grant execute
on function public.admin_send_notifications(uuid[], text, text, text, text)
to authenticated;

-- =========================================================
-- REALTIME
-- =========================================================

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notifications'
  ) then
    alter publication supabase_realtime
      add table public.notifications;
  end if;
end;
$$;

commit;
