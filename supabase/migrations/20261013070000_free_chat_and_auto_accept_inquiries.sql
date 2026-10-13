-- Make direct chat available on every active plan.
UPDATE public.package_catalog
SET chat_enabled = true,
    updated_at = now()
WHERE is_active = true;

-- Chat is a free feature; sending pictures remains a Pro package benefit.
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
    || jsonb_build_array('دردشة مجانية مع العملاء')
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

-- Automatically accept the first office offer received for an active market request.
-- The request schema holds one accepted_offer_id, so later offers cannot also be accepted.
WITH ranked_offers AS (
  SELECT
    oo.id,
    oo.request_id,
    row_number() OVER (
      PARTITION BY oo.request_id
      ORDER BY oo.created_at ASC, oo.id ASC
    ) AS offer_rank
  FROM public.office_offers oo
  JOIN public.property_requests r ON r.id = oo.request_id
  WHERE oo.status = 'sent'
    AND r.status = 'active'
    AND r.accepted_offer_id IS NULL
),
accepted_offers AS (
  UPDATE public.office_offers oo
  SET status = 'accepted',
      end_reason = NULL
  FROM ranked_offers ranked
  WHERE ranked.offer_rank = 1
    AND oo.id = ranked.id
  RETURNING oo.id, oo.request_id
)
UPDATE public.property_requests r
SET accepted_offer_id = accepted.id,
    updated_at = now()
FROM accepted_offers accepted
WHERE r.id = accepted.request_id
  AND r.status = 'active'
  AND r.accepted_offer_id IS NULL;

-- Close other already-sent offers once a request has been automatically accepted,
-- or when the request is no longer active.
UPDATE public.office_offers oo
SET status = 'ended',
    end_reason = COALESCE(
      NULLIF(oo.end_reason, ''),
      'تم قبول عرض آخر تلقائيًا أو لم يعد الطلب متاحًا'
    )
FROM public.property_requests r
WHERE r.id = oo.request_id
  AND oo.status = 'sent'
  AND (r.accepted_offer_id IS NOT NULL OR r.status <> 'active');

CREATE OR REPLACE FUNCTION public.auto_accept_first_market_offer()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $
BEGIN
  IF COALESCE(NEW.status, 'sent') <> 'sent' THEN
    RETURN NEW;
  END IF;

  UPDATE public.property_requests
  SET accepted_offer_id = NEW.id,
      updated_at = now()
  WHERE id = NEW.request_id
    AND status = 'active'
    AND accepted_offer_id IS NULL;

  IF FOUND THEN
    UPDATE public.office_offers
    SET status = 'accepted',
        end_reason = NULL
    WHERE id = NEW.id;
  ELSE
    UPDATE public.office_offers
    SET status = 'ended',
        end_reason = 'تم قبول عرض آخر تلقائيًا أو لم يعد الطلب متاحًا'
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$;

DROP TRIGGER IF EXISTS trg_auto_accept_first_market_offer
ON public.office_offers;

CREATE TRIGGER trg_auto_accept_first_market_offer
AFTER INSERT ON public.office_offers
FOR EACH ROW
EXECUTE FUNCTION public.auto_accept_first_market_offer();

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
