create table if not exists public.user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('individual','office','admin')),
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

alter table public.user_roles enable row level security;

drop policy if exists user_roles_select_own on public.user_roles;

create policy user_roles_select_own
on public.user_roles
for select
to authenticated
using (user_id = auth.uid());
