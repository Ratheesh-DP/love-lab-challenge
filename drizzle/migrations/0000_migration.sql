CREATE TABLE public.user_state (
  user_id uuid PRIMARY KEY,
  state jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.user_state TO authenticated;
GRANT ALL ON public.user_state TO service_role;
ALTER TABLE public.user_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own state read" ON public.user_state FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own state insert" ON public.user_state FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own state update" ON public.user_state FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL DEFAULT auth.uid(),
  person_id text NOT NULL,
  reason text NOT NULL,
  note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.reports TO authenticated;
GRANT ALL ON public.reports TO service_role;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own reports read" ON public.reports FOR SELECT TO authenticated USING (auth.uid() = reporter_id);
CREATE POLICY "own reports insert" ON public.reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id AND length(note) <= 500 AND length(reason) <= 100);