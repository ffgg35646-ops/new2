
begin;

-- =========================================================
-- 1) RLS
-- =========================================================

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.offices enable row level security;
alter table public.office_staff enable row level security;
alter table public.properties enable row level security;
alter table public.property_images enable row level security;
alter table public.favorites enable row level security;
alter table public.follows enable row level security;
alter table public.notifications enable row level security;
alter table public.office_offers enable row level security;
alter table public.office_plan_events enable row level security;
alter table public.office_reviews enable row level security;
alter table public.property_inquiries enable row level security;
alter table public.property_requests enable row level security;
alter table public.property_views enable row level security;
alter table public.reports enable row level security;
alter table public.saved_searches enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.device_tokens enable row level security;
alter table public.viewing_bookings enable row level security;


-- =========================================================
-- 2) SECURITY HELPERS
-- =========================================================

create or replace function public.security_can_manage_property(
    p_property_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
    select exists (
        select 1
        from public.properties p
        join public.offices o
          on o.id = p.office_id
        where p.id = p_property_id
          and o.is_deleted = false
          and (
              o.owner_id = auth.uid()
              or exists (
                  select 1
                  from public.office_staff s
                  where s.office_id = p.office_id
                    and s.user_id = auth.uid()
                    and s.is_active = true
                    and s.can_edit_own_listings = true
              )
          )
    )
    or public.is_admin();
$$;


create or replace function public.security_can_access_request(
    p_request_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
    select exists (
        select 1
        from public.property_requests r
        where r.id = p_request_id
          and (
              r.user_id = auth.uid()
              or public.is_admin()
              or exists (
                  select 1
                  from public.offices o
                  where o.is_deleted = false
                    and o.verification_status = 'verified'
                    and (
                        o.owner_id = auth.uid()
                        or exists (
                            select 1
                            from public.office_staff s
                            where s.office_id = o.id
                              and s.user_id = auth.uid()
                              and s.is_active = true
                              and s.can_view_requests = true
                        )
                    )
                    and exists (
                        select 1
                        from public.properties p
                        where p.office_id = o.id
                          and p.is_deleted = false
                          and p.is_published = true
                          and p.governorate_id = r.governorate_id
                          and p.kind = r.kind
                          and p.listing = r.listing
                          and (
                              r.neighborhood is null
                              or p.neighborhood = r.neighborhood
                          )
                    )
              )
          )
    );
$$;


create or replace function public.security_can_access_conversation(
    p_conversation_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
    select exists (
        select 1
        from public.conversations c
        where c.id = p_conversation_id
          and (
              c.user_id = auth.uid()
              or public.is_admin()
              or exists (
                  select 1
                  from public.offices o
                  where o.id = c.office_id
                    and o.is_deleted = false
                    and (
                        o.owner_id = auth.uid()
                        or exists (
                            select 1
                            from public.office_staff s
                            where s.office_id = o.id
                              and s.user_id = auth.uid()
                              and s.is_active = true
                        )
                    )
              )
          )
    );
$$;


grant execute on function public.security_can_manage_property(uuid)
to authenticated;

grant execute on function public.security_can_access_request(uuid)
to authenticated;

grant execute on function public.security_can_access_conversation(uuid)
to authenticated;


-- =========================================================
-- 3) PROFILES
-- =========================================================

drop policy if exists profiles_select_own on public.profiles;
drop policy if exists profiles_update_own on public.profiles;
drop policy if exists profiles_admin_all on public.profiles;

create policy profiles_select_own
on public.profiles
for select
to authenticated
using (
    id = auth.uid()
    or public.is_admin()
);

create policy profiles_update_own
on public.profiles
for update
to authenticated
using (
    id = auth.uid()
)
with check (
    id = auth.uid()
);

create policy profiles_admin_all
on public.profiles
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());


create or replace function public.security_protect_profile_identity()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
    if not public.is_admin()
       and new.id is distinct from old.id then
        raise exception 'profile_owner_cannot_be_changed';
    end if;

    return new;
end;
$$;

drop trigger if exists trg_security_protect_profile_identity
on public.profiles;

create trigger trg_security_protect_profile_identity
before update on public.profiles
for each row
execute function public.security_protect_profile_identity();


-- =========================================================
-- 4) USER ROLES
-- =========================================================

drop policy if exists user_roles_select_own on public.user_roles;
drop policy if exists user_roles_admin_all on public.user_roles;

create policy user_roles_select_own
on public.user_roles
for select
to authenticated
using (
    user_id = auth.uid()
    or public.is_admin()
);

create policy user_roles_admin_all
on public.user_roles
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());


create or replace function public.security_protect_user_role()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
    if public.is_admin() then
        return new;
    end if;

    if tg_op = 'INSERT' then
        if new.user_id <> auth.uid() then
            raise exception 'role_user_id_forbidden';
        end if;

        if new.role not in ('individual', 'office') then
            raise exception 'role_forbidden';
        end if;

        if exists (
            select 1
            from public.user_roles
            where user_id = auth.uid()
        ) then
            raise exception 'role_already_exists';
        end if;

        return new;
    end if;

    raise exception 'roles_can_only_be_changed_by_admin';

end;
$$;

drop trigger if exists trg_security_protect_user_role
on public.user_roles;

create trigger trg_security_protect_user_role
before insert or update or delete
on public.user_roles
for each row
execute function public.security_protect_user_role();


-- =========================================================
-- 5) OFFICES
-- =========================================================

drop policy if exists offices_public_select on public.offices;
drop policy if exists offices_owner_select on public.offices;
drop policy if exists offices_owner_update on public.offices;
drop policy if exists offices_admin_all on public.offices;

create policy offices_public_select
on public.offices
for select
to anon, authenticated
using (
    is_deleted = false
    and verification_status = 'verified'
);

create policy offices_owner_select
on public.offices
for select
to authenticated
using (
    owner_id = auth.uid()
    or public.is_admin()
);

create policy offices_owner_update
on public.offices
for update
to authenticated
using (
    owner_id = auth.uid()
    or public.is_admin()
)
with check (
    owner_id = auth.uid()
    or public.is_admin()
);

create policy offices_admin_all
on public.offices
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());


create or replace function public.security_protect_office()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
    if public.is_admin() then
        return new;
    end if;

    if new.id is distinct from old.id then
        raise exception 'office_id_cannot_be_changed';
    end if;

    if new.owner_id is distinct from old.owner_id then
        raise exception 'office_owner_cannot_be_changed';
    end if;

    if new.verification_status is distinct from old.verification_status then
        raise exception 'office_verification_admin_only';
    end if;

    if new.rejection_reason is distinct from old.rejection_reason then
        raise exception 'office_rejection_admin_only';
    end if;

    if new.plan is distinct from old.plan then
        raise exception 'office_plan_admin_only';
    end if;

    if new.plan_started_at is distinct from old.plan_started_at then
        raise exception 'office_plan_start_admin_only';
    end if;

    if new.plan_expires_at is distinct from old.plan_expires_at then
        raise exception 'office_plan_expiry_admin_only';
    end if;

    if new.is_deleted is distinct from old.is_deleted then
        raise exception 'office_delete_admin_only';
    end if;

    if new.rating_avg is distinct from old.rating_avg then
        raise exception 'office_rating_admin_only';
    end if;

    if new.reviews_count is distinct from old.reviews_count then
        raise exception 'office_reviews_count_admin_only';
    end if;

    return new;
end;
$$;

drop trigger if exists trg_security_protect_office
on public.offices;

create trigger trg_security_protect_office
before update on public.offices
for each row
execute function public.security_protect_office();


-- =========================================================
-- 6) OFFICE STAFF
-- =========================================================

drop policy if exists office_staff_select on public.office_staff;
drop policy if exists office_staff_insert on public.office_staff;
drop policy if exists office_staff_update on public.office_staff;
drop policy if exists office_staff_delete on public.office_staff;

create policy office_staff_select
on public.office_staff
for select
to authenticated
using (
    user_id = auth.uid()
    or public.is_admin()
    or exists (
        select 1
        from public.offices o
        where o.id = office_staff.office_id
          and o.owner_id = auth.uid()
    )
);

create policy office_staff_insert
on public.office_staff
for insert
to authenticated
with check (
    public.is_admin()
    or exists (
        select 1
        from public.offices o
        where o.id = office_staff.office_id
          and o.owner_id = auth.uid()
          and o.is_deleted = false
    )
);

create policy office_staff_update
on public.office_staff
for update
to authenticated
using (
    public.is_admin()
    or exists (
        select 1
        from public.offices o
        where o.id = office_staff.office_id
          and o.owner_id = auth.uid()
    )
)
with check (
    public.is_admin()
    or exists (
        select 1
        from public.offices o
        where o.id = office_staff.office_id
          and o.owner_id = auth.uid()
    )
);

create policy office_staff_delete
on public.office_staff
for delete
to authenticated
using (
    public.is_admin()
    or exists (
        select 1
        from public.offices o
        where o.id = office_staff.office_id
          and o.owner_id = auth.uid()
    )
);


-- =========================================================
-- 7) PROPERTIES
-- =========================================================

drop policy if exists properties_public_select on public.properties;
drop policy if exists properties_office_insert on public.properties;
drop policy if exists properties_office_update on public.properties;
drop policy if exists properties_office_delete on public.properties;
drop policy if exists properties_admin_all on public.properties;

create policy properties_public_select
on public.properties
for select
to anon, authenticated
using (
    (
        is_published = true
        and is_deleted = false
    )
    or public.security_can_manage_property(id)
    or public.is_admin()
);

create policy properties_office_insert
on public.properties
for insert
to authenticated
with check (
    public.is_admin()
    or exists (
        select 1
        from public.offices o
        where o.id = properties.office_id
          and o.owner_id = auth.uid()
          and o.is_deleted = false
          and o.verification_status = 'verified'
    )
    or exists (
        select 1
        from public.office_staff s
        where s.office_id = properties.office_id
          and s.user_id = auth.uid()
          and s.is_active = true
          and s.can_add_listing = true
    )
);

create policy properties_office_update
on public.properties
for update
to authenticated
using (
    public.security_can_manage_property(id)
    or public.is_admin()
)
with check (
    public.security_can_manage_property(id)
    or public.is_admin()
);

create policy properties_office_delete
on public.properties
for delete
to authenticated
using (
    public.security_can_manage_property(id)
    or public.is_admin()
);

create policy properties_admin_all
on public.properties
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());


create or replace function public.security_protect_property()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
    if public.is_admin() then
        return new;
    end if;

    if new.id is distinct from old.id then
        raise exception 'property_id_cannot_be_changed';
    end if;

    if new.office_id is distinct from old.office_id then
        raise exception 'property_office_cannot_be_changed';
    end if;

    if new.property_number is distinct from old.property_number then
        raise exception 'property_number_cannot_be_changed';
    end if;

    if new.favorites_count is distinct from old.favorites_count then
        raise exception 'property_favorites_count_system_only';
    end if;

    if new.views_count is distinct from old.views_count then
        raise exception 'property_views_count_system_only';
    end if;

    if new.images_count is distinct from old.images_count then
        raise exception 'property_images_count_system_only';
    end if;

    return new;
end;
$$;

drop trigger if exists trg_security_protect_property
on public.properties;

create trigger trg_security_protect_property
before update on public.properties
for each row
execute function public.security_protect_property();


-- =========================================================
-- 8) PROPERTY IMAGES
-- =========================================================

drop policy if exists property_images_public_select on public.property_images;
drop policy if exists property_images_insert on public.property_images;
drop policy if exists property_images_update on public.property_images;
drop policy if exists property_images_delete on public.property_images;

create policy property_images_public_select
on public.property_images
for select
to anon, authenticated
using (
    exists (
        select 1
        from public.properties p
        where p.id = property_images.property_id
          and (
              (
                  p.is_published = true
                  and p.is_deleted = false
              )
              or public.security_can_manage_property(p.id)
              or public.is_admin()
          )
    )
);

create policy property_images_insert
on public.property_images
for insert
to authenticated
with check (
    public.security_can_manage_property(property_id)
    or public.is_admin()
);

create policy property_images_update
on public.property_images
for update
to authenticated
using (
    public.security_can_manage_property(property_id)
    or public.is_admin()
)
with check (
    public.security_can_manage_property(property_id)
    or public.is_admin()
);

create policy property_images_delete
on public.property_images
for delete
to authenticated
using (
    public.security_can_manage_property(property_id)
    or public.is_admin()
);


-- =========================================================
-- 9) FAVORITES
-- =========================================================

drop policy if exists favorites_select_own on public.favorites;
drop policy if exists favorites_insert_own on public.favorites;
drop policy if exists favorites_update_own on public.favorites;
drop policy if exists favorites_delete_own on public.favorites;

create policy favorites_select_own
on public.favorites
for select
to authenticated
using (user_id = auth.uid());

create policy favorites_insert_own
on public.favorites
for insert
to authenticated
with check (
    user_id = auth.uid()
);

create policy favorites_update_own
on public.favorites
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy favorites_delete_own
on public.favorites
for delete
to authenticated
using (user_id = auth.uid());


-- =========================================================
-- 10) FOLLOWS
-- =========================================================

drop policy if exists follows_select_own on public.follows;
drop policy if exists follows_insert_own on public.follows;
drop policy if exists follows_update_own on public.follows;
drop policy if exists follows_delete_own on public.follows;

create policy follows_select_own
on public.follows
for select
to authenticated
using (user_id = auth.uid());

create policy follows_insert_own
on public.follows
for insert
to authenticated
with check (user_id = auth.uid());

create policy follows_update_own
on public.follows
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy follows_delete_own
on public.follows
for delete
to authenticated
using (user_id = auth.uid());


-- =========================================================
-- 11) NOTIFICATIONS
-- =========================================================

drop policy if exists notifications_select_own on public.notifications;
drop policy if exists notifications_insert_admin on public.notifications;
drop policy if exists notifications_update_own on public.notifications;
drop policy if exists notifications_delete_own on public.notifications;

create policy notifications_select_own
on public.notifications
for select
to authenticated
using (
    user_id = auth.uid()
    or public.is_admin()
);

create policy notifications_insert_admin
on public.notifications
for insert
to authenticated
with check (
    public.is_admin()
);

create policy notifications_update_own
on public.notifications
for update
to authenticated
using (
    user_id = auth.uid()
    or public.is_admin()
)
with check (
    user_id = auth.uid()
    or public.is_admin()
);

create policy notifications_delete_own
on public.notifications
for delete
to authenticated
using (
    user_id = auth.uid()
    or public.is_admin()
);

create or replace function public.security_protect_notification()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
    if not public.is_admin() then
        if new.user_id is distinct from old.user_id then
            raise exception 'notification_user_cannot_be_changed';
        end if;

        if new.title is distinct from old.title then
            raise exception 'notification_title_admin_only';
        end if;

        if new.body is distinct from old.body then
            raise exception 'notification_body_admin_only';
        end if;

        if new.type is distinct from old.type then
            raise exception 'notification_type_admin_only';
        end if;

        if new.link is distinct from old.link then
            raise exception 'notification_link_admin_only';
        end if;
    end if;

    return new;
end;
$$;

drop trigger if exists trg_security_protect_notification
on public.notifications;

create trigger trg_security_protect_notification
before update on public.notifications
for each row
execute function public.security_protect_notification();


-- =========================================================
-- 12) PROPERTY REQUESTS
-- =========================================================

drop policy if exists property_requests_select on public.property_requests;
drop policy if exists property_requests_insert_own on public.property_requests;
drop policy if exists property_requests_update_own on public.property_requests;
drop policy if exists property_requests_delete_own on public.property_requests;

create policy property_requests_select
on public.property_requests
for select
to authenticated
using (
    public.security_can_access_request(id)
);

create policy property_requests_insert_own
on public.property_requests
for insert
to authenticated
with check (
    user_id = auth.uid()
);

create policy property_requests_update_own
on public.property_requests
for update
to authenticated
using (
    user_id = auth.uid()
    or public.is_admin()
)
with check (
    user_id = auth.uid()
    or public.is_admin()
);

create policy property_requests_delete_own
on public.property_requests
for delete
to authenticated
using (
    user_id = auth.uid()
    or public.is_admin()
);

create or replace function public.security_protect_request()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
    if not public.is_admin()
       and new.user_id is distinct from old.user_id then
        raise exception 'request_user_cannot_be_changed';
    end if;

    return new;
end;
$$;

drop trigger if exists trg_security_protect_request
on public.property_requests;

create trigger trg_security_protect_request
before update on public.property_requests
for each row
execute function public.security_protect_request();


-- =========================================================
-- 13) OFFICE OFFERS
-- =========================================================

drop policy if exists office_offers_select on public.office_offers;
drop policy if exists office_offers_insert on public.office_offers;
drop policy if exists office_offers_update on public.office_offers;
drop policy if exists office_offers_delete on public.office_offers;

create policy office_offers_select
on public.office_offers
for select
to authenticated
using (
    public.is_admin()

    or exists (
        select 1
        from public.property_requests r
        where r.id = office_offers.request_id
          and r.user_id = auth.uid()
    )

    or exists (
        select 1
        from public.offices o
        where o.id = office_offers.office_id
          and (
              o.owner_id = auth.uid()
              or exists (
                  select 1
                  from public.office_staff s
                  where s.office_id = o.id
                    and s.user_id = auth.uid()
                    and s.is_active = true
              )
          )
    )
);

create policy office_offers_insert
on public.office_offers
for insert
to authenticated
with check (
    exists (
        select 1
        from public.offices o
        where o.id = office_offers.office_id
          and o.is_deleted = false
          and o.verification_status = 'verified'
          and (
              o.owner_id = auth.uid()
              or exists (
                  select 1
                  from public.office_staff s
                  where s.office_id = o.id
                    and s.user_id = auth.uid()
                    and s.is_active = true
                    and s.can_view_requests = true
              )
          )
    )
    and exists (
        select 1
        from public.property_requests r
        where r.id = office_offers.request_id
          and r.status = 'active'
    )
);

create policy office_offers_update
on public.office_offers
for update
to authenticated
using (
    public.is_admin()

    or exists (
        select 1
        from public.property_requests r
        where r.id = office_offers.request_id
          and r.user_id = auth.uid()
    )

    or exists (
        select 1
        from public.offices o
        where o.id = office_offers.office_id
          and (
              o.owner_id = auth.uid()
              or exists (
                  select 1
                  from public.office_staff s
                  where s.office_id = o.id
                    and s.user_id = auth.uid()
                    and s.is_active = true
              )
          )
    )
)
with check (
    public.is_admin()

    or exists (
        select 1
        from public.property_requests r
        where r.id = office_offers.request_id
          and r.user_id = auth.uid()
    )

    or exists (
        select 1
        from public.offices o
        where o.id = office_offers.office_id
          and (
              o.owner_id = auth.uid()
              or exists (
                  select 1
                  from public.office_staff s
                  where s.office_id = o.id
                    and s.user_id = auth.uid()
                    and s.is_active = true
              )
          )
    )
);

create policy office_offers_delete
on public.office_offers
for delete
to authenticated
using (
    public.is_admin()
    or exists (
        select 1
        from public.offices o
        where o.id = office_offers.office_id
          and o.owner_id = auth.uid()
    )
);

create or replace function public.security_protect_offer()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
    if not public.is_admin() then
        if new.office_id is distinct from old.office_id then
            raise exception 'offer_office_cannot_be_changed';
        end if;

        if new.request_id is distinct from old.request_id then
            raise exception 'offer_request_cannot_be_changed';
        end if;

        if new.property_id is distinct from old.property_id then
            raise exception 'offer_property_cannot_be_changed';
        end if;
    end if;

    return new;
end;
$$;

drop trigger if exists trg_security_protect_offer
on public.office_offers;

create trigger trg_security_protect_offer
before update on public.office_offers
for each row
execute function public.security_protect_offer();


-- =========================================================
-- 14) VIEWING BOOKINGS
-- =========================================================

drop policy if exists viewing_bookings_select on public.viewing_bookings;
drop policy if exists viewing_bookings_insert on public.viewing_bookings;
drop policy if exists viewing_bookings_update on public.viewing_bookings;
drop policy if exists viewing_bookings_delete on public.viewing_bookings;

create policy viewing_bookings_select
on public.viewing_bookings
for select
to authenticated
using (
    user_id = auth.uid()
    or public.is_admin()
    or exists (
        select 1
        from public.offices o
        where o.id = viewing_bookings.office_id
          and (
              o.owner_id = auth.uid()
              or exists (
                  select 1
                  from public.office_staff s
                  where s.office_id = o.id
                    and s.user_id = auth.uid()
                    and s.is_active = true
              )
          )
    )
);

create policy viewing_bookings_insert
on public.viewing_bookings
for insert
to authenticated
with check (
    user_id = auth.uid()
    and exists (
        select 1
        from public.properties p
        where p.id = viewing_bookings.property_id
          and p.office_id = viewing_bookings.office_id
          and p.is_deleted = false
          and p.is_published = true
    )
);

create policy viewing_bookings_update
on public.viewing_bookings
for update
to authenticated
using (
    public.is_admin()
    or user_id = auth.uid()
    or exists (
        select 1
        from public.offices o
        where o.id = viewing_bookings.office_id
          and (
              o.owner_id = auth.uid()
              or exists (
                  select 1
                  from public.office_staff s
                  where s.office_id = o.id
                    and s.user_id = auth.uid()
                    and s.is_active = true
              )
          )
    )
)
with check (
    public.is_admin()
    or user_id = auth.uid()
    or exists (
        select 1
        from public.offices o
        where o.id = viewing_bookings.office_id
          and (
              o.owner_id = auth.uid()
              or exists (
                  select 1
                  from public.office_staff s
                  where s.office_id = o.id
                    and s.user_id = auth.uid()
                    and s.is_active = true
              )
          )
    )
);

create policy viewing_bookings_delete
on public.viewing_bookings
for delete
to authenticated
using (
    user_id = auth.uid()
    or public.is_admin()
);

create or replace function public.security_protect_booking()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
    if public.is_admin() then
        return new;
    end if;

    if new.user_id is distinct from old.user_id then
        raise exception 'booking_user_cannot_be_changed';
    end if;

    if new.office_id is distinct from old.office_id then
        raise exception 'booking_office_cannot_be_changed';
    end if;

    if new.property_id is distinct from old.property_id then
        raise exception 'booking_property_cannot_be_changed';
    end if;

    return new;
end;
$$;

drop trigger if exists trg_security_protect_booking
on public.viewing_bookings;

create trigger trg_security_protect_booking
before update on public.viewing_bookings
for each row
execute function public.security_protect_booking();


-- =========================================================
-- 15) PROPERTY INQUIRIES
-- =========================================================

drop policy if exists property_inquiries_select on public.property_inquiries;
drop policy if exists property_inquiries_insert on public.property_inquiries;
drop policy if exists property_inquiries_update on public.property_inquiries;
drop policy if exists property_inquiries_delete on public.property_inquiries;

create policy property_inquiries_select
on public.property_inquiries
for select
to authenticated
using (
    user_id = auth.uid()
    or public.is_admin()
    or exists (
        select 1
        from public.offices o
        where o.id = property_inquiries.office_id
          and (
              o.owner_id = auth.uid()
              or exists (
                  select 1
                  from public.office_staff s
                  where s.office_id = o.id
                    and s.user_id = auth.uid()
                    and s.is_active = true
              )
          )
    )
);

create policy property_inquiries_insert
on public.property_inquiries
for insert
to authenticated
with check (
    user_id = auth.uid()
    and exists (
        select 1
        from public.properties p
        where p.id = property_inquiries.property_id
          and p.office_id = property_inquiries.office_id
          and p.is_deleted = false
          and p.is_published = true
    )
);

create policy property_inquiries_update
on public.property_inquiries
for update
to authenticated
using (
    public.is_admin()
    or exists (
        select 1
        from public.offices o
        where o.id = property_inquiries.office_id
          and (
              o.owner_id = auth.uid()
              or exists (
                  select 1
                  from public.office_staff s
                  where s.office_id = o.id
                    and s.user_id = auth.uid()
                    and s.is_active = true
              )
          )
    )
)
with check (
    public.is_admin()
    or exists (
        select 1
        from public.offices o
        where o.id = property_inquiries.office_id
          and (
              o.owner_id = auth.uid()
              or exists (
                  select 1
                  from public.office_staff s
                  where s.office_id = o.id
                    and s.user_id = auth.uid()
                    and s.is_active = true
              )
          )
    )
);

create policy property_inquiries_delete
on public.property_inquiries
for delete
to authenticated
using (
    user_id = auth.uid()
    or public.is_admin()
);

create or replace function public.security_protect_inquiry()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
    if not public.is_admin() then
        if new.user_id is distinct from old.user_id then
            raise exception 'inquiry_user_cannot_be_changed';
        end if;

        if new.office_id is distinct from old.office_id then
            raise exception 'inquiry_office_cannot_be_changed';
        end if;

        if new.property_id is distinct from old.property_id then
            raise exception 'inquiry_property_cannot_be_changed';
        end if;
    end if;

    return new;
end;
$$;

drop trigger if exists trg_security_protect_inquiry
on public.property_inquiries;

create trigger trg_security_protect_inquiry
before update on public.property_inquiries
for each row
execute function public.security_protect_inquiry();


-- =========================================================
-- 16) SAVED SEARCHES
-- =========================================================

drop policy if exists saved_searches_select_own on public.saved_searches;
drop policy if exists saved_searches_insert_own on public.saved_searches;
drop policy if exists saved_searches_update_own on public.saved_searches;
drop policy if exists saved_searches_delete_own on public.saved_searches;

create policy saved_searches_select_own
on public.saved_searches
for select
to authenticated
using (user_id = auth.uid());

create policy saved_searches_insert_own
on public.saved_searches
for insert
to authenticated
with check (user_id = auth.uid());

create policy saved_searches_update_own
on public.saved_searches
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy saved_searches_delete_own
on public.saved_searches
for delete
to authenticated
using (user_id = auth.uid());


-- =========================================================
-- 17) DEVICE TOKENS
-- =========================================================

drop policy if exists device_tokens_select_own on public.device_tokens;
drop policy if exists device_tokens_insert_own on public.device_tokens;
drop policy if exists device_tokens_update_own on public.device_tokens;
drop policy if exists device_tokens_delete_own on public.device_tokens;

create policy device_tokens_select_own
on public.device_tokens
for select
to authenticated
using (user_id = auth.uid());

create policy device_tokens_insert_own
on public.device_tokens
for insert
to authenticated
with check (user_id = auth.uid());

create policy device_tokens_update_own
on public.device_tokens
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy device_tokens_delete_own
on public.device_tokens
for delete
to authenticated
using (user_id = auth.uid());


-- =========================================================
-- 18) CONVERSATIONS
-- =========================================================

drop policy if exists conversations_select_participant on public.conversations;
drop policy if exists conversations_insert_participant on public.conversations;
drop policy if exists conversations_update_participant on public.conversations;
drop policy if exists conversations_delete_participant on public.conversations;

create policy conversations_select_participant
on public.conversations
for select
to authenticated
using (
    public.security_can_access_conversation(id)
);

create policy conversations_insert_participant
on public.conversations
for insert
to authenticated
with check (
    user_id = auth.uid()
    and exists (
        select 1
        from public.offices o
        where o.id = conversations.office_id
          and o.is_deleted = false
    )
);

create policy conversations_update_participant
on public.conversations
for update
to authenticated
using (
    public.security_can_access_conversation(id)
)
with check (
    public.security_can_access_conversation(id)
);

create policy conversations_delete_participant
on public.conversations
for delete
to authenticated
using (
    user_id = auth.uid()
    or public.is_admin()
);

create or replace function public.security_protect_conversation()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
    if not public.is_admin() then
        if new.user_id is distinct from old.user_id then
            raise exception 'conversation_user_cannot_be_changed';
        end if;

        if new.office_id is distinct from old.office_id then
            raise exception 'conversation_office_cannot_be_changed';
        end if;

        if new.property_id is distinct from old.property_id then
            raise exception 'conversation_property_cannot_be_changed';
        end if;

        if new.request_id is distinct from old.request_id then
            raise exception 'conversation_request_cannot_be_changed';
        end if;
    end if;

    return new;
end;
$$;

drop trigger if exists trg_security_protect_conversation
on public.conversations;

create trigger trg_security_protect_conversation
before update on public.conversations
for each row
execute function public.security_protect_conversation();


-- =========================================================
-- 19) MESSAGES
-- =========================================================

drop policy if exists messages_select_participant on public.messages;
drop policy if exists messages_insert_sender on public.messages;
drop policy if exists messages_update_participant on public.messages;
drop policy if exists messages_delete_sender on public.messages;

create policy messages_select_participant
on public.messages
for select
to authenticated
using (
    public.security_can_access_conversation(conversation_id)
);

create policy messages_insert_sender
on public.messages
for insert
to authenticated
with check (
    sender_id = auth.uid()
    and public.security_can_access_conversation(conversation_id)
);

create policy messages_update_participant
on public.messages
for update
to authenticated
using (
    sender_id = auth.uid()
    or public.is_admin()
)
with check (
    sender_id = auth.uid()
    or public.is_admin()
);

create policy messages_delete_sender
on public.messages
for delete
to authenticated
using (
    sender_id = auth.uid()
    or public.is_admin()
);


-- =========================================================
-- 20) OFFICE REVIEWS
-- =========================================================

drop policy if exists office_reviews_public_select on public.office_reviews;
drop policy if exists office_reviews_insert_own on public.office_reviews;
drop policy if exists office_reviews_update_own on public.office_reviews;
drop policy if exists office_reviews_delete_own on public.office_reviews;

create policy office_reviews_public_select
on public.office_reviews
for select
to anon, authenticated
using (true);

create policy office_reviews_insert_own
on public.office_reviews
for insert
to authenticated
with check (
    user_id = auth.uid()
);

create policy office_reviews_update_own
on public.office_reviews
for update
to authenticated
using (
    user_id = auth.uid()
    or public.is_admin()
)
with check (
    user_id = auth.uid()
    or public.is_admin()
);

create policy office_reviews_delete_own
on public.office_reviews
for delete
to authenticated
using (
    user_id = auth.uid()
    or public.is_admin()
);


-- =========================================================
-- 21) PROPERTY VIEWS
-- =========================================================

drop policy if exists property_views_insert on public.property_views;
drop policy if exists property_views_select on public.property_views;

create policy property_views_insert
on public.property_views
for insert
to anon, authenticated
with check (
    user_id is null
    or user_id = auth.uid()
);

create policy property_views_select
on public.property_views
for select
to authenticated
using (
    public.is_admin()
    or exists (
        select 1
        from public.properties p
        where p.id = property_views.property_id
          and public.security_can_manage_property(p.id)
    )
);


-- =========================================================
-- 22) REPORTS
-- =========================================================

drop policy if exists reports_select on public.reports;
drop policy if exists reports_insert_own on public.reports;
drop policy if exists reports_update_admin on public.reports;
drop policy if exists reports_delete_own on public.reports;

create policy reports_select
on public.reports
for select
to authenticated
using (
    reporter_id = auth.uid()
    or public.is_admin()
);

create policy reports_insert_own
on public.reports
for insert
to authenticated
with check (
    reporter_id = auth.uid()
);

create policy reports_update_admin
on public.reports
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy reports_delete_own
on public.reports
for delete
to authenticated
using (
    reporter_id = auth.uid()
    or public.is_admin()
);


-- =========================================================
-- 23) OFFICE PLAN EVENTS
-- =========================================================

drop policy if exists office_plan_events_select on public.office_plan_events;
drop policy if exists office_plan_events_admin_all on public.office_plan_events;

create policy office_plan_events_select
on public.office_plan_events
for select
to authenticated
using (
    public.is_admin()
    or exists (
        select 1
        from public.offices o
        where o.id = office_plan_events.office_id
          and o.owner_id = auth.uid()
    )
);

create policy office_plan_events_admin_all
on public.office_plan_events
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());


-- =========================================================
-- 24) GOVERNORATES / NEIGHBORHOODS
-- =========================================================

drop policy if exists governorates_public_select on public.governorates;
drop policy if exists governorates_admin_all on public.governorates;

create policy governorates_public_select
on public.governorates
for select
to anon, authenticated
using (true);

create policy governorates_admin_all
on public.governorates
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());


drop policy if exists neighborhoods_public_select on public.neighborhoods;
drop policy if exists neighborhoods_admin_all on public.neighborhoods;

create policy neighborhoods_public_select
on public.neighborhoods
for select
to anon, authenticated
using (true);

create policy neighborhoods_admin_all
on public.neighborhoods
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());


-- =========================================================
-- 25) STORAGE
-- =========================================================

update storage.buckets
set
    file_size_limit = 8388608,
    allowed_mime_types = array[
        'image/jpeg',
        'image/png',
        'image/webp'
    ]
where id = 'property-media';


drop policy if exists property_media_insert_own
on storage.objects;

drop policy if exists property_media_select_own
on storage.objects;

drop policy if exists property_media_update_own
on storage.objects;

drop policy if exists property_media_delete_own
on storage.objects;


create policy property_media_insert_own
on storage.objects
for insert
to authenticated
with check (
    bucket_id = 'property-media'
    and (storage.foldername(name))[1] = auth.uid()::text
);


create policy property_media_select_own
on storage.objects
for select
to authenticated
using (
    bucket_id = 'property-media'
    and (
        (storage.foldername(name))[1] = auth.uid()::text
        or public.is_admin()
    )
);


create policy property_media_update_own
on storage.objects
for update
to authenticated
using (
    bucket_id = 'property-media'
    and (
        (storage.foldername(name))[1] = auth.uid()::text
        or public.is_admin()
    )
)
with check (
    bucket_id = 'property-media'
    and (
        (storage.foldername(name))[1] = auth.uid()::text
        or public.is_admin()
    )
);


create policy property_media_delete_own
on storage.objects
for delete
to authenticated
using (
    bucket_id = 'property-media'
    and (
        (storage.foldername(name))[1] = auth.uid()::text
        or public.is_admin()
    )
);


commit;
