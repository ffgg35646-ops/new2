
-- =========================================================
-- إشعارات الأدمن
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

  if array_length(_user_ids, 1) > 5000 then
    raise exception 'too_many_recipients';
  end if;

  if length(trim(coalesce(_title, ''))) < 2 then
    raise exception 'invalid_title';
  end if;

  if length(trim(coalesce(_body, ''))) < 2 then
    raise exception 'invalid_body';
  end if;

  safe_link :=
    case
      when coalesce(_link, '') like '/%' then _link
      else '/notifications'
    end;

  insert into public.notifications (
    user_id,
    title,
    body,
    type,
    link,
    is_read
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
-- حماية إشعارات المستخدم
-- =========================================================

alter table public.notifications enable row level security;

drop policy if exists notifications_select_own
on public.notifications;

create policy notifications_select_own
on public.notifications
for select
to authenticated
using (auth.uid() = user_id);


drop policy if exists notifications_update_own
on public.notifications;

create policy notifications_update_own
on public.notifications
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);


drop policy if exists notifications_delete_own
on public.notifications;

create policy notifications_delete_own
on public.notifications
for delete
to authenticated
using (auth.uid() = user_id);


-- لا نعطي المستخدمين INSERT مباشر.
-- الإدخال الإداري يتم من خلال الدالة أعلاه.


-- =========================================================
-- تفعيل Supabase Realtime لعداد الجرس
-- =========================================================

do $$
begin
  alter publication supabase_realtime add table public.notifications;
exception
  when duplicate_object then
    null;
end
$$;
