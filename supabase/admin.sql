create or replace function public.admin_delete_user(
  _user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;

  if _user_id = auth.uid() then
    raise exception 'cannot_delete_self';
  end if;

  delete from auth.users
  where id = _user_id;

  if not found then
    raise exception 'user_not_found';
  end if;
end;
$$;

revoke all
on function public.admin_delete_user(uuid)
from public;

grant execute
on function public.admin_delete_user(uuid)
to authenticated;
