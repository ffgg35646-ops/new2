
-- =========================================================
-- 1) رد مكتب على طلب عقار
-- =========================================================

create or replace function public.notify_property_request_offer()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  request_user uuid;
  office_name text;
begin
  select pr.user_id, o.name
  into request_user, office_name
  from public.property_requests pr
  join public.offices o on o.id = new.office_id
  where pr.id = new.request_id;

  if request_user is not null then
    insert into public.notifications (
      user_id,
      title,
      body,
      type,
      link
    )
    values (
      request_user,
      'وصل رد من مكتب عقاري',
      'أرسل ' || coalesce(office_name, 'مكتب عقاري') || ' عرضًا على طلبك العقاري.',
      'property_offer',
      '/request'
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
-- 2) قبول أو رفض حجز المعاينة
-- =========================================================

create or replace function public.notify_booking_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  property_title text;
  status_title text;
  status_body text;
begin
  if old.status is distinct from new.status
     and new.status::text in ('accepted', 'rejected') then

    select title
    into property_title
    from public.properties
    where id = new.property_id;

    if new.status::text = 'accepted' then
      status_title := 'تم قبول حجز المعاينة';
      status_body :=
        'تم قبول موعد معاينة ' ||
        coalesce(property_title, 'العقار') ||
        '.';
    else
      status_title := 'تم رفض حجز المعاينة';
      status_body :=
        'تم رفض طلب معاينة ' ||
        coalesce(property_title, 'العقار') ||
        '.';
    end if;

    insert into public.notifications (
      user_id,
      title,
      body,
      type,
      link
    )
    values (
      new.user_id,
      status_title,
      status_body,
      'booking_status',
      '/request'
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
-- 3) عقار جديد مطابق لبحث محفوظ
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

    -- المحافظة
    if filters ? 'governorateId'
       and nullif(filters->>'governorateId', '') is not null
       and filters->>'governorateId' <> new.governorate_id::text then
      matched := false;
    end if;

    -- نوع العقار
    if matched
       and filters ? 'kind'
       and nullif(filters->>'kind', '') is not null
       and filters->>'kind' <> new.kind::text then
      matched := false;
    end if;

    -- نوع العرض
    if matched
       and filters ? 'listing'
       and nullif(filters->>'listing', '') is not null
       and filters->>'listing' <> new.listing::text then
      matched := false;
    end if;

    -- الحي
    if matched
       and filters ? 'neighborhood'
       and nullif(filters->>'neighborhood', '') is not null
       and filters->>'neighborhood' <> coalesce(new.neighborhood, '') then
      matched := false;
    end if;

    -- أقل سعر
    if matched
       and nullif(filters->>'minPrice', '') is not null
       and new.price < (filters->>'minPrice')::numeric then
      matched := false;
    end if;

    -- أعلى سعر
    if matched
       and nullif(filters->>'maxPrice', '') is not null
       and new.price > (filters->>'maxPrice')::numeric then
      matched := false;
    end if;

    -- أقل مساحة
    if matched
       and nullif(filters->>'minArea', '') is not null
       and new.area < (filters->>'minArea')::numeric then
      matched := false;
    end if;

    -- أعلى مساحة
    if matched
       and nullif(filters->>'maxArea', '') is not null
       and new.area > (filters->>'maxArea')::numeric then
      matched := false;
    end if;

    -- عدد الغرف
    if matched
       and nullif(filters->>'rooms', '') is not null
       and (
         new.rooms is null
         or new.rooms < (filters->>'rooms')::numeric
       ) then
      matched := false;
    end if;

    -- كلمة البحث
    if matched
       and nullif(filters->>'search', '') is not null
       and (
         new.title not ilike '%' || (filters->>'search') || '%'
         and coalesce(new.neighborhood, '') not ilike '%' || (filters->>'search') || '%'
       ) then
      matched := false;
    end if;

    if matched then
      insert into public.notifications (
        user_id,
        title,
        body,
        type,
        link
      )
      values (
        saved.user_id,
        'عقار جديد مطابق لبحثك',
        'تمت إضافة عقار جديد يطابق الشروط التي حفظتها.',
        'saved_search_match',
        '/properties/' || new.property_number
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
-- 4) تخفيض سعر عقار محفوظ في المفضلة
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
        user_id,
        title,
        body,
        type,
        link
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
        '/properties/' || new.property_number
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
-- حماية الدوال
-- =========================================================

revoke all
on function public.notify_property_request_offer()
from public;

revoke all
on function public.notify_booking_status_change()
from public;

revoke all
on function public.notify_matching_saved_searches()
from public;

revoke all
on function public.notify_favorite_price_drop()
from public;
