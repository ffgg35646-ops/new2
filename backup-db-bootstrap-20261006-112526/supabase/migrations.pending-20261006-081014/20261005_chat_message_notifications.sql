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
  v_recipient uuid;
  v_body text;
begin
  select c.user_id, c.office_id
    into v_user_id, v_office_id
  from public.conversations c
  where c.id = NEW.conversation_id;

  if v_user_id is null or v_office_id is null then
    return NEW;
  end if;

  v_body :=
    case
      when NEW.body is not null and length(trim(NEW.body)) > 0
        then left(NEW.body, 120)
      when NEW.image_url is not null
        then '📷 أرسل صورة'
      else
        'أرسل رسالة جديدة'
    end;

  /*
    العميل أرسل الرسالة:
    نرسل إشعارًا لصاحب المكتب وكل الموظفين النشطين.
  */
  if NEW.sender_id = v_user_id then

    select o.owner_id
      into v_owner_id
    from public.offices o
    where o.id = v_office_id;

    if v_owner_id is not null and v_owner_id <> NEW.sender_id then
      insert into public.notifications (
        user_id,
        title,
        body,
        type,
        link,
        is_read
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
      user_id,
      title,
      body,
      type,
      link,
      is_read
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
      and os.user_id <> NEW.sender_id
      and os.user_id <> coalesce(v_owner_id, '00000000-0000-0000-0000-000000000000'::uuid);

  /*
    المكتب أرسل الرسالة:
    نرسل إشعارًا للعميل.
  */
  else

    v_recipient := v_user_id;

    insert into public.notifications (
      user_id,
      title,
      body,
      type,
      link,
      is_read
    )
    values (
      v_recipient,
      'رسالة جديدة من المكتب',
      v_body,
      'chat_message',
      '/chats?c=' || NEW.conversation_id,
      false
    );

  end if;

  return NEW;
end;
$$;


drop trigger if exists trg_notify_new_chat_message
on public.messages;

create trigger trg_notify_new_chat_message
after insert on public.messages
for each row
execute function public.notify_new_chat_message();
