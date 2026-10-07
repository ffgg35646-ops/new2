create or replace function public.notify_matching_saved_searches()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  saved record;
  v_filters jsonb;
  matched boolean;
begin
  for saved in
    select
      ss.user_id,
      ss.filters as saved_filters
    from public.saved_searches ss
    where ss.notify = true
  loop
    v_filters := coalesce(saved.saved_filters::jsonb, '{}'::jsonb);
    matched := true;

    if v_filters ? 'governorateId'
       and nullif(v_filters->>'governorateId', '') is not null
       and v_filters->>'governorateId' <> new.governorate_id::text then
      matched := false;
    end if;

    if matched
       and v_filters ? 'kind'
       and nullif(v_filters->>'kind', '') is not null
       and v_filters->>'kind' <> new.kind::text then
      matched := false;
    end if;

    if matched
       and v_filters ? 'listing'
       and nullif(v_filters->>'listing', '') is not null
       and v_filters->>'listing' <> new.listing::text then
      matched := false;
    end if;

    if matched
       and v_filters ? 'neighborhood'
       and nullif(v_filters->>'neighborhood', '') is not null
       and v_filters->>'neighborhood' <> coalesce(new.neighborhood, '') then
      matched := false;
    end if;

    if matched
       and nullif(v_filters->>'minPrice', '') is not null
       and new.price < (v_filters->>'minPrice')::numeric then
      matched := false;
    end if;

    if matched
       and nullif(v_filters->>'maxPrice', '') is not null
       and new.price > (v_filters->>'maxPrice')::numeric then
      matched := false;
    end if;

    if matched
       and nullif(v_filters->>'minArea', '') is not null
       and new.area < (v_filters->>'minArea')::numeric then
      matched := false;
    end if;

    if matched
       and nullif(v_filters->>'maxArea', '') is not null
       and new.area > (v_filters->>'maxArea')::numeric then
      matched := false;
    end if;

    if matched
       and nullif(v_filters->>'rooms', '') is not null
       and (
         new.rooms is null
         or new.rooms < (v_filters->>'rooms')::numeric
       ) then
      matched := false;
    end if;

    if matched
       and nullif(v_filters->>'search', '') is not null
       and (
         new.title not ilike '%' || (v_filters->>'search') || '%'
         and coalesce(new.neighborhood, '') not ilike '%' || (v_filters->>'search') || '%'
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
        'تم نشر عقار جديد يطابق أحد عمليات البحث المحفوظة لديك.',
        'saved_search',
        '/properties'
      );
    end if;
  end loop;

  return new;
end;
$$;
