-- Make direct chat available on every active plan.
UPDATE public.package_catalog
SET chat_enabled = true,
    updated_at = now()
WHERE is_active = true;

-- Chat and sending pictures in chat are free features, not Pro-only package benefits.
UPDATE public.package_catalog AS p
SET features = COALESCE((
  SELECT jsonb_agg(to_jsonb(f.feature) ORDER BY f.ordinality)
  FROM jsonb_array_elements_text(
    CASE
      WHEN jsonb_typeof(p.features) = 'array' THEN p.features
      ELSE '[]'::jsonb
    END
  ) WITH ORDINALITY AS f(feature, ordinality)
  WHERE f.feature NOT ILIKE '%دردشة%'
    AND f.feature NOT ILIKE '%المحادثة%'
), '[]'::jsonb),
updated_at = now()
WHERE lower(COALESCE(p.code, '')) = 'pro';

UPDATE public.package_catalog AS p
SET features = CASE
  WHEN EXISTS (
    SELECT 1
    FROM jsonb_array_elements_text(
      CASE
        WHEN jsonb_typeof(p.features) = 'array' THEN p.features
        ELSE '[]'::jsonb
      END
    ) AS f(feature)
    WHERE f.feature ILIKE '%دردشة%'
  ) THEN p.features
  ELSE COALESCE(p.features, '[]'::jsonb)
    || jsonb_build_array('دردشة مجانية مع العملاء', 'إرسال الصور داخل المحادثة')
  END,
  chat_enabled = true,
  updated_at = now()
WHERE lower(COALESCE(p.code, '')) = 'free';

-- Contact inquiries are accepted automatically so they appear in the Accepted tab.
CREATE OR REPLACE FUNCTION public.auto_accept_property_inquiry()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.status := 'accepted';
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_accept_property_inquiry
ON public.property_inquiries;

CREATE TRIGGER trg_auto_accept_property_inquiry
BEFORE INSERT ON public.property_inquiries
FOR EACH ROW
EXECUTE FUNCTION public.auto_accept_property_inquiry();

-- Move existing unhandled contact inquiries into the Accepted tab as well.
UPDATE public.property_inquiries
SET status = 'accepted',
    updated_at = now()
WHERE status = 'new';

-- Let an office start a conversation only with a client connected to that office
-- through an inquiry, viewing booking, or accepted/completed market offer.
DROP POLICY IF EXISTS conversations_insert_participant ON public.conversations;
DROP POLICY IF EXISTS conversations_user_create ON public.conversations;
DROP POLICY IF EXISTS "conversations user create" ON public.conversations;
DROP POLICY IF EXISTS "conversations participants insert" ON public.conversations;

CREATE POLICY conversations_insert_participant
ON public.conversations
FOR INSERT
TO authenticated
WITH CHECK (
  (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.offices o
      WHERE o.id = conversations.office_id
        AND o.is_deleted = false
    )
  )
  OR
  (
    EXISTS (
      SELECT 1
      FROM public.offices o
      WHERE o.id = conversations.office_id
        AND (
          o.owner_id = auth.uid()
          OR EXISTS (
            SELECT 1
            FROM public.office_staff s
            WHERE s.office_id = o.id
              AND s.user_id = auth.uid()
              AND s.is_active = true
          )
        )
    )
    AND (
      EXISTS (
        SELECT 1
        FROM public.property_inquiries i
        WHERE i.user_id = conversations.user_id
          AND i.office_id = conversations.office_id
          AND i.status = 'accepted'
      )
      OR EXISTS (
        SELECT 1
        FROM public.viewing_bookings b
        WHERE b.user_id = conversations.user_id
          AND b.office_id = conversations.office_id
      )
      OR EXISTS (
        SELECT 1
        FROM public.property_requests r
        JOIN public.office_offers oo
          ON oo.office_id = conversations.office_id
         AND (
           oo.id = r.accepted_offer_id
           OR oo.id = r.completed_offer_id
         )
        WHERE r.user_id = conversations.user_id
      )
    )
  )
);
