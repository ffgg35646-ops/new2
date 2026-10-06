
-- AUTO_BASE_CHAT_TABLES_V1
-- Base chat tables required by the later chat/security migrations.

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  office_id uuid not null references public.offices(id) on delete cascade,
  property_id uuid null references public.properties(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, office_id)
);

create index if not exists conversations_user_id_idx
  on public.conversations(user_id);

create index if not exists conversations_office_id_idx
  on public.conversations(office_id);

create index if not exists conversations_property_id_idx
  on public.conversations(property_id);

alter table public.conversations enable row level security;

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text null,
  image_url text null,
  created_at timestamptz not null default now()
);

create index if not exists messages_conversation_id_idx
  on public.messages(conversation_id);

create index if not exists messages_sender_id_idx
  on public.messages(sender_id);

create index if not exists messages_created_at_idx
  on public.messages(created_at);

alter table public.messages enable row level security;

create or replace function public.is_conversation_participant(_conversation_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.conversations c
    where c.id = _conversation_id
      and (
        c.user_id = auth.uid()
        or exists (
          select 1
          from public.offices o
          where o.id = c.office_id
            and o.owner_id = auth.uid()
        )
        or exists (
          select 1
          from public.office_staff os
          where os.office_id = c.office_id
            and os.user_id = auth.uid()
            and os.is_active = true
        )
      )
  );
$$;

drop policy if exists "conversations participants select"
on public.conversations;

create policy "conversations participants select"
on public.conversations
for select
to authenticated
using (
  public.is_conversation_participant(id)
);

drop policy if exists "conversations user create"
on public.conversations;

create policy "conversations user create"
on public.conversations
for insert
to authenticated
with check (
  user_id = auth.uid()
);

drop policy if exists "messages participants select"
on public.messages;

create policy "messages participants select"
on public.messages
for select
to authenticated
using (
  public.is_conversation_participant(conversation_id)
);

drop policy if exists "messages participants insert"
on public.messages;

create policy "messages participants insert"
on public.messages
for insert
to authenticated
with check (
  sender_id = auth.uid()
  and public.is_conversation_participant(conversation_id)
);

create or replace function public.touch_conversation_on_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversations
  set updated_at = now()
  where id = new.conversation_id;

  return new;
end;
$$;

drop trigger if exists trg_touch_conversation_on_message
on public.messages;

create trigger trg_touch_conversation_on_message
after insert on public.messages
for each row
execute function public.touch_conversation_on_message();

-- =========================================================
-- 1. Conversation blocks
-- =========================================================

create table if not exists public.conversation_blocks (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  blocker_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (conversation_id, blocker_id)
);

alter table public.conversation_blocks enable row level security;

create or replace function public.is_chat_participant(_conversation_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.conversations c
    where c.id = _conversation_id
      and (
        c.user_id = auth.uid()
        or exists (
          select 1
          from public.offices o
          where o.id = c.office_id
            and o.owner_id = auth.uid()
        )
        or exists (
          select 1
          from public.office_staff os
          where os.office_id = c.office_id
            and os.user_id = auth.uid()
            and os.is_active = true
        )
      )
  );
$$;

drop policy if exists "chat blocks select participants"
on public.conversation_blocks;

create policy "chat blocks select participants"
on public.conversation_blocks
for select
to authenticated
using (
  public.is_chat_participant(conversation_id)
);

drop policy if exists "chat blocks insert participants"
on public.conversation_blocks;

create policy "chat blocks insert participants"
on public.conversation_blocks
for insert
to authenticated
with check (
  blocker_id = auth.uid()
  and public.is_chat_participant(conversation_id)
);

drop policy if exists "chat blocks delete own"
on public.conversation_blocks;

create policy "chat blocks delete own"
on public.conversation_blocks
for delete
to authenticated
using (
  blocker_id = auth.uid()
);

-- =========================================================
-- 2. Stop messages when either side blocked the conversation
-- =========================================================

create or replace function public.prevent_blocked_chat_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (
    select 1
    from public.conversation_blocks cb
    where cb.conversation_id = new.conversation_id
  ) then
    raise exception 'CHAT_BLOCKED';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_prevent_blocked_chat_message
on public.messages;

create trigger trg_prevent_blocked_chat_message
before insert on public.messages
for each row
execute function public.prevent_blocked_chat_message();

-- =========================================================
-- 3. Allow authenticated users to create valid reports
-- =========================================================

drop policy if exists "chat reports insert authenticated"
on public.reports;

create policy "chat reports insert authenticated"
on public.reports
for insert
to authenticated
with check (
  auth.uid() = reporter_id
  and (
    property_id is null
    or exists (
      select 1
      from public.properties p
      where p.id = property_id
    )
  )
);

-- =========================================================
-- 4. Notify every admin when a report is created
-- =========================================================

create or replace function public.notify_admins_about_report()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reporter_name text;
  v_title text;
begin
  select coalesce(p.full_name, 'مستخدم')
  into v_reporter_name
  from public.profiles p
  where p.id = new.reporter_id;

  v_title := 'بلاغ جديد';

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
    v_title,
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
-- 5. Notifications realtime
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

-- Optional realtime for blocks
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'conversation_blocks'
  ) then
    alter publication supabase_realtime
      add table public.conversation_blocks;
  end if;
end;
$$;
