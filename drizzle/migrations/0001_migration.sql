CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own roles read" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

CREATE TABLE public.purchase_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  bundle_id text NOT NULL,
  points integer NOT NULL,
  amount_inr integer NOT NULL,
  reference text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  claimed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz
);
GRANT SELECT, INSERT, UPDATE ON public.purchase_requests TO authenticated;
GRANT ALL ON public.purchase_requests TO service_role;
ALTER TABLE public.purchase_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own requests read" ON public.purchase_requests FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "own requests insert" ON public.purchase_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND status = 'pending' AND claimed = false AND length(reference) BETWEEN 6 AND 40
    AND ((bundle_id = 'spark' AND points = 100 AND amount_inr = 149)
      OR (bundle_id = 'flame' AND points = 300 AND amount_inr = 399)
      OR (bundle_id = 'wildfire' AND points = 750 AND amount_inr = 799)));
CREATE POLICY "admins review" ON public.purchase_requests FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE UNIQUE INDEX purchase_requests_reference_key ON public.purchase_requests (lower(reference));

-- Dater collects approved, unclaimed purchases exactly once
CREATE OR REPLACE FUNCTION public.claim_purchases()
RETURNS TABLE (id uuid, points integer, bundle_id text)
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  UPDATE public.purchase_requests p SET claimed = true
  WHERE p.user_id = auth.uid() AND p.status = 'approved' AND p.claimed = false
  RETURNING p.id, p.points, p.bundle_id
$$;
REVOKE EXECUTE ON FUNCTION public.claim_purchases() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.claim_purchases() TO authenticated;