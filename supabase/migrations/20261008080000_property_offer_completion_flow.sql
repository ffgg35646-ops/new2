-- Separate a property's request lifecycle from each office's individual offer.
-- An office may request completion, but only the requester confirms the final completion.

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

  if not public.is_admin()
     and new.status is distinct from old.status then
    if auth.uid() is distinct from old.user_id then
      raise exception 'only_request_owner_can_change_status';
    end if;

    if old.status::text <> 'active' then
      raise exception 'request_not_active';
    end if;

    if new.status::text not in ('fulfilled', 'cancelled') then
      raise exception 'invalid_request_status_transition';
    end if;

    if new.status::text = 'fulfilled'
       and exists (
         select 1
         from public.office_offers oo
         where oo.request_id = old.id
           and oo.status in ('accepted', 'awaiting_confirmation')
       )
       and not exists (
         select 1
         from public.office_offers oo
         where oo.request_id = old.id
           and oo.status = 'completed'
       ) then
      raise exception 'offer_completion_confirmation_required';
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.security_protect_offer()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_request_owner uuid;
  v_request_status text;
  v_current_office uuid;
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

    if new.status is distinct from old.status then
      select pr.user_id, pr.status::text
      into v_request_owner, v_request_status
      from public.property_requests pr
      where pr.id = old.request_id;

      v_current_office := public.office_member_office_id();

      if v_current_office is not null and v_current_office = old.office_id then
        if old.status not in ('sent', 'accepted', 'awaiting_confirmation')
           or new.status not in ('awaiting_confirmation', 'ended', 'deleted') then
          raise exception 'invalid_office_offer_status_transition';
        end if;
      elsif v_request_owner = auth.uid() then
        if old.status = 'sent'
              and new.status in ('accepted', 'rejected')
              and v_request_status = 'active' then
          null;
        elsif old.status = 'awaiting_confirmation'
              and new.status = 'completed'
              and v_request_status = 'active' then
          null;
        elsif v_request_status in ('fulfilled', 'cancelled')
              and old.status in ('sent', 'accepted', 'awaiting_confirmation')
              and new.status = 'ended' then
          null;
        else
          raise exception 'invalid_customer_offer_status_transition';
        end if;
      else
        raise exception 'not_allowed_to_change_offer_status';
      end if;
    end if;
  end if;

  return new;
end;
$$;

-- Replace the existing guards in-place so legacy RPCs cannot let an office
-- close a customer's request or mark its own offer fully completed.
drop trigger if exists trg_security_protect_request on public.property_requests;
create trigger trg_security_protect_request
before update on public.property_requests
for each row
execute function public.security_protect_request();

drop trigger if exists trg_security_protect_offer on public.office_offers;
create trigger trg_security_protect_offer
before update on public.office_offers
for each row
execute function public.security_protect_offer();


create or replace function public.respond_to_property_offer(
  _offer_id uuid,
  _status text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_request_id uuid;
  v_request_owner uuid;
  v_request_status text;
  v_offer_status text;
  v_office_id uuid;
  v_office_owner uuid;
begin
  if auth.uid() is null then
    raise exception 'authentication_required';
  end if;

  if _status not in ('accepted', 'rejected') then
    raise exception 'invalid_offer_response';
  end if;

  select oo.request_id, oo.status, oo.office_id, pr.user_id, pr.status::text
  into v_request_id, v_offer_status, v_office_id, v_request_owner, v_request_status
  from public.office_offers oo
  join public.property_requests pr on pr.id = oo.request_id
  where oo.id = _offer_id
  for update of oo, pr;

  if not found then
    raise exception 'offer_not_found';
  end if;

  if v_request_owner <> auth.uid() then
    raise exception 'not_request_owner';
  end if;

  if v_request_status <> 'active' then
    raise exception 'request_not_active';
  end if;

  if v_offer_status <> 'sent' then
    raise exception 'offer_not_awaiting_response';
  end if;

  update public.office_offers
  set status = _status
  where id = _offer_id;

  select owner_id into v_office_owner
  from public.offices
  where id = v_office_id;

  if v_office_owner is not null then
    insert into public.notifications (user_id, title, body, type, link)
    values (
      v_office_owner,
      case when _status = 'accepted' then 'تم قبول عرضك' else 'تم رفض عرضك' end,
      case when _status = 'accepted'
        then 'قبل العميل عرضك. انتظر تأكيد إتمام الصفقة قبل تسجيلها كمكتملة.'
        else 'رفض العميل العرض الذي أرسلته.' end,
      'property_offer_response',
      '/office/requests'
    );
  end if;
end;
$$;


create or replace function public.office_request_offer_completion(
  _offer_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_request_id uuid;
  v_request_owner uuid;
  v_request_status text;
  v_offer_status text;
  v_offer_office uuid;
  v_current_office uuid;
begin
  v_current_office := public.office_member_office_id();
  if v_current_office is null then
    raise exception 'not_office_member';
  end if;

  select oo.request_id, oo.status, oo.office_id, pr.user_id, pr.status::text
  into v_request_id, v_offer_status, v_offer_office, v_request_owner, v_request_status
  from public.office_offers oo
  join public.property_requests pr on pr.id = oo.request_id
  where oo.id = _offer_id
  for update of oo, pr;

  if not found then
    raise exception 'offer_not_found';
  end if;

  if v_offer_office <> v_current_office then
    raise exception 'not_offer_owner';
  end if;

  if v_request_status <> 'active' then
    raise exception 'request_not_active';
  end if;

  if v_offer_status not in ('sent', 'accepted') then
    raise exception 'offer_cannot_request_completion';
  end if;

  update public.office_offers
  set status = 'awaiting_confirmation'
  where id = _offer_id;

  if v_request_owner is not null then
    insert into public.notifications (user_id, title, body, type, link)
    values (
      v_request_owner,
      'تأكيد إتمام الصفقة',
      'أبلغك المكتب بإتمام الصفقة. راجع التفاصيل ثم أكّد الإتمام من صفحة العروض المستلمة.',
      'property_offer_completion',
      '/requests?tab=received'
    );
  end if;
end;
$$;


create or replace function public.office_end_offer(
  _offer_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_offer_office uuid;
  v_offer_status text;
  v_request_id uuid;
  v_current_office uuid;
  v_request_owner uuid;
begin
  v_current_office := public.office_member_office_id();
  if v_current_office is null then
    raise exception 'not_office_member';
  end if;

  select oo.office_id, oo.status, oo.request_id, pr.user_id
  into v_offer_office, v_offer_status, v_request_id, v_request_owner
  from public.office_offers oo
  join public.property_requests pr on pr.id = oo.request_id
  where oo.id = _offer_id
  for update of oo, pr;

  if not found then
    raise exception 'offer_not_found';
  end if;

  if v_offer_office <> v_current_office then
    raise exception 'not_offer_owner';
  end if;

  if v_offer_status not in ('sent', 'accepted', 'awaiting_confirmation') then
    raise exception 'offer_cannot_be_ended';
  end if;

  update public.office_offers
  set status = 'ended'
  where id = _offer_id;

  if v_request_owner is not null then
    insert into public.notifications (user_id, title, body, type, link)
    values (
      v_request_owner,
      'انتهى عرض المكتب',
      'أنهى المكتب عرضه دون تأكيد إتمام الصفقة داخل التطبيق.',
      'property_offer_ended',
      '/requests?tab=received'
    );
  end if;
end;
$$;


create or replace function public.confirm_property_offer_completion(
  _offer_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_request_id uuid;
  v_request_owner uuid;
  v_request_status text;
  v_offer_status text;
  v_office_id uuid;
  v_office_owner uuid;
begin
  if auth.uid() is null then
    raise exception 'authentication_required';
  end if;

  select oo.request_id, oo.status, oo.office_id, pr.user_id, pr.status::text
  into v_request_id, v_offer_status, v_office_id, v_request_owner, v_request_status
  from public.office_offers oo
  join public.property_requests pr on pr.id = oo.request_id
  where oo.id = _offer_id
  for update of oo, pr;

  if not found then
    raise exception 'offer_not_found';
  end if;

  if v_request_owner <> auth.uid() then
    raise exception 'not_request_owner';
  end if;

  if v_request_status <> 'active' then
    raise exception 'request_not_active';
  end if;

  if v_offer_status <> 'awaiting_confirmation' then
    raise exception 'offer_not_awaiting_confirmation';
  end if;

  update public.office_offers
  set status = 'completed'
  where id = _offer_id;

  update public.property_requests
  set status = 'fulfilled'::public.request_status,
      updated_at = now()
  where id = v_request_id
    and status::text = 'active';

  if not found then
    raise exception 'request_not_active';
  end if;

  -- Other offices' offers end; they are not completed and cannot be confirmed.
  update public.office_offers
  set status = 'ended'
  where request_id = v_request_id
    and id <> _offer_id
    and status in ('sent', 'accepted', 'awaiting_confirmation');

  select owner_id into v_office_owner
  from public.offices
  where id = v_office_id;

  if v_office_owner is not null then
    insert into public.notifications (user_id, title, body, type, link)
    values (
      v_office_owner,
      'أكد العميل إتمام الصفقة',
      'أكد العميل إتمام الصفقة؛ تم إغلاق الطلب كمكتمل.',
      'property_offer_completed',
      '/office/requests?tab=sent'
    );
  end if;
end;
$$;


create or replace function public.set_my_property_request_status(
  _request_id uuid,
  _status text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then
    raise exception 'authentication_required';
  end if;

  if _status not in ('fulfilled', 'cancelled') then
    raise exception 'invalid_request_status';
  end if;

  update public.property_requests
  set status = _status::public.request_status,
      updated_at = now()
  where id = _request_id
    and user_id = auth.uid()
    and status::text = 'active';

  if not found then
    raise exception 'request_not_found_or_not_active';
  end if;

  -- When the customer closes a request outside a tracked offer, archive its
  -- outstanding offers as ended; do not label them as completed.
  update public.office_offers
  set status = 'ended'
  where request_id = _request_id
    and status in ('sent', 'accepted', 'awaiting_confirmation');
end;
$$;


revoke all on function public.respond_to_property_offer(uuid, text) from public;
revoke all on function public.office_request_offer_completion(uuid) from public;
revoke all on function public.office_end_offer(uuid) from public;
revoke all on function public.confirm_property_offer_completion(uuid) from public;
revoke all on function public.set_my_property_request_status(uuid, text) from public;

grant execute on function public.respond_to_property_offer(uuid, text) to authenticated;
grant execute on function public.office_request_offer_completion(uuid) to authenticated;
grant execute on function public.office_end_offer(uuid) to authenticated;
grant execute on function public.confirm_property_offer_completion(uuid) to authenticated;
grant execute on function public.set_my_property_request_status(uuid, text) to authenticated;
