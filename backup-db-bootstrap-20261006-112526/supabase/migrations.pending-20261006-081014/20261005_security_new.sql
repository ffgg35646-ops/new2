/* =========================================================
   SECURITY FOR NEW SYSTEM
   1) Notifications
   2) Messages
   3) Profiles / email privacy
   4) Storage files
   ========================================================= */

------------------------------------------------------------
-- Helpers
------------------------------------------------------------

create or replace function public.is_conversation_participant(
  _conversation_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_admin()
    or exists (
      select 1
      from public.conversations c
      where c.id = _conversation_id
        and (
          c.user_id = auth.uid()
          or c.office_id = public.my_office_id()
          or c.office_id = public.office_member_office_id()
        )
    );
$$;

grant execute on function public.is_conversation_participant(uuid)
to authenticated;


------------------------------------------------------------
-- 1. NOTIFICATIONS
------------------------------------------------------------

alter table public.notifications enable row level security;

drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own"
on public.notifications
for select
to authenticated
using (
  user_id = auth.uid()
);

drop policy if exists "notifications_update_read_only" on public.notifications;
create policy "notifications_update_read_only"
on public.notifications
for update
to authenticated
using (
  user_id = auth.uid()
)
with check (
  user_id = auth.uid()
);

-- المستخدم لا ينشئ Notifications بنفسه.
drop policy if exists "notifications_insert_user" on public.notifications;

-- منع الحذف من المستخدمين.
drop policy if exists "notifications_delete_user" on public.notifications;

-- حماية الإشعار من تغيير title/body/link/type
-- المستخدم يستطيع تغيير is_read فقط.
create or replace function public.protect_notification_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin

  if new.user_id is distinct from old.user_id
     or new.title is distinct from old.title
     or new.body is distinct from old.body
     or new.link is distinct from old.link
     or new.type is distinct from old.type
  then
    raise exception 'لا يمكن تعديل بيانات الإشعار';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_protect_notification_update
on public.notifications;

create trigger trg_protect_notification_update
before update on public.notifications
for each row
execute function public.protect_notification_update();


------------------------------------------------------------
-- 2. MESSAGES
------------------------------------------------------------

alter table public.messages enable row level security;

drop policy if exists "messages_select_participant" on public.messages;
create policy "messages_select_participant"
on public.messages
for select
to authenticated
using (
  public.is_conversation_participant(conversation_id)
);

drop policy if exists "messages_insert_participant" on public.messages;
create policy "messages_insert_participant"
on public.messages
for insert
to authenticated
with check (
  sender_id = auth.uid()
  and public.is_conversation_participant(conversation_id)
);

drop policy if exists "messages_update_protected" on public.messages;
create policy "messages_update_protected"
on public.messages
for update
to authenticated
using (
  public.is_conversation_participant(conversation_id)
)
with check (
  public.is_conversation_participant(conversation_id)
);

-- لا نسمح بحذف الرسائل من التطبيق.
drop policy if exists "messages_delete_user" on public.messages;


-- حماية الحقول الأساسية:
-- conversation_id / sender_id / created_at
-- لا يمكن تغييرها بعد إنشاء الرسالة.
create or replace function public.protect_message_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin

  if new.conversation_id is distinct from old.conversation_id
     or new.sender_id is distinct from old.sender_id
     or new.created_at is distinct from old.created_at
  then
    raise exception 'لا يمكن تغيير بيانات الرسالة الأساسية';
  end if;

  /*
    لو المرسل نفسه يعدل الرسالة:
    يسمح بتعديل body/image_url.

    لو شخص آخر يعدلها:
    يسمح فقط بتغيير read_at.
  */
  if auth.uid() <> old.sender_id then

    if new.body is distinct from old.body
       or new.image_url is distinct from old.image_url
    then
      raise exception 'لا يمكنك تعديل رسالة مستخدم آخر';
    end if;

  end if;

  return new;
end;
$$;

drop trigger if exists trg_protect_message_update
on public.messages;

create trigger trg_protect_message_update
before update on public.messages
for each row
execute function public.protect_message_update();


------------------------------------------------------------
-- 3. EMAIL PRIVACY
------------------------------------------------------------

/*
  profiles يحتوي email.
  المستخدم العادي لا يستطيع قراءة صفوف الآخرين.
  الإدارة تستطيع.
*/
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_private" on public.profiles;

create policy "profiles_select_private"
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
  or public.is_admin()
);


/*
  View آمن للاستخدام في الشاشات التي تحتاج اسم المستخدم
  بدون email.
*/
drop view if exists public.public_profiles;

create view public.public_profiles
with (security_invoker = true)
as
select
  id,
  full_name,
  avatar_url,
  governorate_id
from public.profiles;

grant select on public.public_profiles to authenticated;


------------------------------------------------------------
-- 4. STORAGE
------------------------------------------------------------

/*
  bucket property-media يظل PRIVATE.
*/
insert into storage.buckets (id, name, public)
values ('property-media', 'property-media', false)
on conflict (id) do update
set public = false;


/*
  حذف سياسات قديمة بنفس الأسماء فقط.
*/
drop policy if exists "property_media_insert_own" on storage.objects;
drop policy if exists "property_media_update_own" on storage.objects;
drop policy if exists "property_media_delete_own" on storage.objects;
drop policy if exists "property_media_select_secure" on storage.objects;


------------------------------------------------------------
-- Upload
-- كل مستخدم يرفع فقط داخل المجلد الخاص به.
------------------------------------------------------------

create policy "property_media_insert_own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'property-media'
  and split_part(name, '/', 1) = auth.uid()::text
);


------------------------------------------------------------
-- Update
------------------------------------------------------------

create policy "property_media_update_own"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'property-media'
  and (
    split_part(name, '/', 1) = auth.uid()::text
    or public.is_admin()
  )
)
with check (
  bucket_id = 'property-media'
  and (
    split_part(name, '/', 1) = auth.uid()::text
    or public.is_admin()
  )
);


------------------------------------------------------------
-- Delete
------------------------------------------------------------

create policy "property_media_delete_own"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'property-media'
  and (
    split_part(name, '/', 1) = auth.uid()::text
    or public.is_admin()
  )
);


------------------------------------------------------------
-- SELECT FILES
------------------------------------------------------------

create policy "property_media_select_secure"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'property-media'

  and
  (
    -- الإدارة
    public.is_admin()

    -- صاحب الملف
    or split_part(name, '/', 1) = auth.uid()::text

    -- صور العقارات الجديدة:
    -- مسموح للمستخدم المسجل بعرضها
    or split_part(name, '/', 2) = 'properties'

    -- ملفات الشات:
    -- path:
    -- userId/chat/conversationId/file
    or (
      split_part(name, '/', 2) = 'chat'
      and public.is_conversation_participant(
        nullif(split_part(name, '/', 3), '')::uuid
      )
    )

    -- ملفات الدعم:
    -- userId/support/ticketId/file
    or (
      split_part(name, '/', 2) = 'support'
      and exists (
        select 1
        from public.support_tickets st
        where st.id =
          nullif(split_part(name, '/', 3), '')::uuid
        and (
          st.user_id = auth.uid()
          or public.is_admin()
        )
      )
    )
  )
);


------------------------------------------------------------
-- 5. SUPPORT SECURITY
------------------------------------------------------------

/*
  لو نظام الدعم موجود بالفعل، نطبق عليه RLS.
*/
do $$
begin

  if to_regclass('public.support_tickets') is not null then

    execute 'alter table public.support_tickets enable row level security';

    execute 'drop policy if exists "support_tickets_select_secure" on public.support_tickets';

    execute '
      create policy "support_tickets_select_secure"
      on public.support_tickets
      for select
      to authenticated
      using (
        user_id = auth.uid()
        or public.is_admin()
      )
    ';

    execute 'drop policy if exists "support_tickets_insert_own" on public.support_tickets';

    execute '
      create policy "support_tickets_insert_own"
      on public.support_tickets
      for insert
      to authenticated
      with check (
        user_id = auth.uid()
      )
    ';

    execute 'drop policy if exists "support_tickets_update_secure" on public.support_tickets';

    execute '
      create policy "support_tickets_update_secure"
      on public.support_tickets
      for update
      to authenticated
      using (
        user_id = auth.uid()
        or public.is_admin()
      )
      with check (
        user_id = auth.uid()
        or public.is_admin()
      )
    ';

  end if;


  if to_regclass('public.support_messages') is not null then

    execute 'alter table public.support_messages enable row level security';

    execute 'drop policy if exists "support_messages_select_secure" on public.support_messages';

    execute '
      create policy "support_messages_select_secure"
      on public.support_messages
      for select
      to authenticated
      using (
        exists (
          select 1
          from public.support_tickets st
          where st.id = support_messages.ticket_id
          and (
            st.user_id = auth.uid()
            or public.is_admin()
          )
        )
      )
    ';

    execute 'drop policy if exists "support_messages_insert_secure" on public.support_messages';

    execute '
      create policy "support_messages_insert_secure"
      on public.support_messages
      for insert
      to authenticated
      with check (
        sender_id = auth.uid()
        and exists (
          select 1
          from public.support_tickets st
          where st.id = support_messages.ticket_id
          and (
            st.user_id = auth.uid()
            or public.is_admin()
          )
        )
      )
    ';

    execute 'drop policy if exists "support_messages_update_secure" on public.support_messages';

    execute '
      create policy "support_messages_update_secure"
      on public.support_messages
      for update
      to authenticated
      using (
        exists (
          select 1
          from public.support_tickets st
          where st.id = support_messages.ticket_id
          and (
            st.user_id = auth.uid()
            or public.is_admin()
          )
        )
      )
      with check (
        exists (
          select 1
          from public.support_tickets st
          where st.id = support_messages.ticket_id
          and (
            st.user_id = auth.uid()
            or public.is_admin()
          )
        )
      )
    ';

  end if;

end $$;
