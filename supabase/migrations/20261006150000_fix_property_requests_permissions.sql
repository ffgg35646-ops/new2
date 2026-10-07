-- Fix authenticated permissions for property request creation.
-- RLS already restricts inserts to the current user's own user_id.
grant select, insert, update, delete
on table public.property_requests
to authenticated;
