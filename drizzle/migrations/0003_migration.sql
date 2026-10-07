CREATE OR REPLACE FUNCTION public._apply_points(_uid uuid, _amount int, _label text, _kind text, _ref text)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE bal int;
BEGIN
  INSERT INTO wallets (user_id) VALUES (_uid) ON CONFLICT DO NOTHING;
  IF NOT EXISTS (SELECT 1 FROM point_ledger WHERE user_id = _uid AND kind = 'welcome') THEN
    INSERT INTO point_ledger (user_id, amount, label, kind, ref) VALUES (_uid, 100, 'Welcome bonus', 'welcome', '');
  END IF;
  SELECT points INTO bal FROM wallets WHERE user_id = _uid FOR UPDATE;
  IF _amount = 0 THEN RETURN bal; END IF;
  IF bal + _amount < 0 THEN RAISE EXCEPTION 'not_enough_points'; END IF;
  BEGIN
    INSERT INTO point_ledger (user_id, amount, label, kind, ref) VALUES (_uid, _amount, left(_label, 120), _kind, _ref);
  EXCEPTION WHEN unique_violation THEN
    RETURN bal;
  END;
  UPDATE wallets SET points = points + _amount, updated_at = now() WHERE user_id = _uid RETURNING points INTO bal;
  RETURN bal;
END $$;
REVOKE EXECUTE ON FUNCTION public._apply_points(uuid,int,text,text,text) FROM public, anon, authenticated;