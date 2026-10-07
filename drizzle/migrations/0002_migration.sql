CREATE TABLE public.wallets (
  user_id uuid PRIMARY KEY,
  points integer NOT NULL DEFAULT 100 CHECK (points >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.wallets TO authenticated;
GRANT ALL ON public.wallets TO service_role;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own wallet read" ON public.wallets FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.point_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount integer NOT NULL,
  label text NOT NULL,
  kind text NOT NULL,
  ref text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX point_ledger_user_idx ON public.point_ledger (user_id, created_at DESC);
CREATE UNIQUE INDEX point_ledger_once_idx ON public.point_ledger (user_id, kind, ref) WHERE kind IN ('match','note','checkin','purchase','welcome');
GRANT SELECT ON public.point_ledger TO authenticated;
GRANT ALL ON public.point_ledger TO service_role;
ALTER TABLE public.point_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own ledger read" ON public.point_ledger FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX notifications_user_idx ON public.notifications (user_id, created_at DESC);
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own notifications read" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own notifications mark read" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
REVOKE UPDATE ON public.notifications FROM authenticated;
GRANT UPDATE (read) ON public.notifications TO authenticated;

ALTER TABLE public.purchase_requests ADD COLUMN reject_reason text;

-- Admins must use review_purchase(); remove direct update access
DROP POLICY "admins review" ON public.purchase_requests;
REVOKE UPDATE ON public.purchase_requests FROM authenticated;

-- Carry over existing balances once
INSERT INTO public.wallets (user_id, points)
SELECT user_id, GREATEST(0, COALESCE((state->>'points')::int, 100)) FROM public.user_state
ON CONFLICT DO NOTHING;
INSERT INTO public.point_ledger (user_id, amount, label, kind, ref)
SELECT user_id, points, 'Starting balance', 'welcome', '' FROM public.wallets
ON CONFLICT DO NOTHING;

-- Internal: apply a point change atomically
CREATE OR REPLACE FUNCTION public._apply_points(_uid uuid, _amount int, _label text, _kind text, _ref text)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE bal int;
BEGIN
  INSERT INTO wallets (user_id) VALUES (_uid) ON CONFLICT DO NOTHING;
  IF NOT EXISTS (SELECT 1 FROM point_ledger WHERE user_id = _uid AND kind = 'welcome') THEN
    INSERT INTO point_ledger (user_id, amount, label, kind, ref) VALUES (_uid, 100, 'Welcome bonus', 'welcome', '');
  END IF;
  SELECT points INTO bal FROM wallets WHERE user_id = _uid FOR UPDATE;
  IF bal + _amount < 0 THEN RAISE EXCEPTION 'not_enough_points'; END IF;
  BEGIN
    INSERT INTO point_ledger (user_id, amount, label, kind, ref) VALUES (_uid, _amount, left(_label, 120), _kind, _ref);
  EXCEPTION WHEN unique_violation THEN
    RETURN bal; -- already earned, no change
  END;
  UPDATE wallets SET points = points + _amount, updated_at = now() WHERE user_id = _uid RETURNING points INTO bal;
  RETURN bal;
END $$;
REVOKE EXECUTE ON FUNCTION public._apply_points(uuid,int,text,text,text) FROM public, anon, authenticated;

CREATE OR REPLACE FUNCTION public.ensure_wallet()
RETURNS integer LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT public._apply_points(auth.uid(), 0, 'Wallet opened', 'open', gen_random_uuid()::text) WHERE auth.uid() IS NOT NULL
$$;

-- Earning rules live here, not in the app
CREATE OR REPLACE FUNCTION public.earn_points(_kind text, _ref text)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); n int;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not_signed_in'; END IF;
  IF _kind = 'match' AND _ref IN ('nora','theo','jonah','ines') THEN
    RETURN _apply_points(uid, 10, 'New match', 'match', _ref);
  ELSIF _kind = 'note' AND _ref ~ '^[0-9]{1,2}$' AND _ref::int BETWEEN 1 AND 60 THEN
    RETURN _apply_points(uid, 5, 'Diary entry · day ' || _ref, 'note', _ref);
  ELSIF _kind = 'checkin' THEN
    RETURN _apply_points(uid, 20, 'Daily check-in', 'checkin', to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD'));
  ELSIF _kind = 'openers' THEN
    SELECT count(*) INTO n FROM point_ledger WHERE user_id = uid AND kind = 'openers' AND created_at > now() - interval '1 day';
    IF n >= 5 THEN RETURN (SELECT points FROM wallets WHERE user_id = uid); END IF;
    RETURN _apply_points(uid, 3, 'Generated openers', 'openers', gen_random_uuid()::text);
  END IF;
  RAISE EXCEPTION 'invalid_earn';
END $$;

CREATE OR REPLACE FUNCTION public.spend_on_date(_kind_id text, _label text)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE cost int;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not_signed_in'; END IF;
  cost := CASE _kind_id WHEN 'coffee' THEN 30 WHEN 'dinner' THEN 60 WHEN 'rooftop' THEN 70 WHEN 'surprise' THEN 90 END;
  IF cost IS NULL THEN RAISE EXCEPTION 'invalid_date_kind'; END IF;
  RETURN _apply_points(auth.uid(), -cost, _label, 'date', gen_random_uuid()::text);
END $$;

CREATE OR REPLACE FUNCTION public.review_purchase(_id uuid, _approve boolean, _reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r purchase_requests%ROWTYPE;
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT * INTO r FROM purchase_requests WHERE id = _id AND status = 'pending' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'not_pending'; END IF;
  IF _approve THEN
    UPDATE purchase_requests SET status = 'approved', claimed = true, reviewed_at = now() WHERE id = _id;
    PERFORM _apply_points(r.user_id, r.points, 'Bought ' || r.points || ' pts', 'purchase', r.id::text);
    INSERT INTO notifications (user_id, title, body) VALUES (r.user_id, 'Payment approved',
      r.points || ' points were added to your wallet for your ₹' || r.amount_inr || ' payment.');
  ELSE
    IF coalesce(trim(_reason), '') = '' THEN RAISE EXCEPTION 'reason_required'; END IF;
    UPDATE purchase_requests SET status = 'rejected', reject_reason = left(_reason, 300), reviewed_at = now() WHERE id = _id;
    INSERT INTO notifications (user_id, title, body) VALUES (r.user_id, 'Payment not approved',
      'Your ₹' || r.amount_inr || ' payment for ' || r.points || ' points was rejected: ' || left(_reason, 300));
  END IF;
END $$;

DROP FUNCTION public.claim_purchases();

REVOKE EXECUTE ON FUNCTION public.ensure_wallet(), public.earn_points(text,text), public.spend_on_date(text,text), public.review_purchase(uuid,boolean,text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.ensure_wallet(), public.earn_points(text,text), public.spend_on_date(text,text), public.review_purchase(uuid,boolean,text) TO authenticated;