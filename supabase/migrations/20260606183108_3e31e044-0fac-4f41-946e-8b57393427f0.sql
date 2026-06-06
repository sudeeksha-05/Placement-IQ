
CREATE TABLE public.quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  topic text NOT NULL,
  difficulty text NOT NULL,
  score integer NOT NULL DEFAULT 0,
  total integer NOT NULL DEFAULT 0,
  percentage integer NOT NULL DEFAULT 0,
  target_role text,
  weak_areas jsonb NOT NULL DEFAULT '[]'::jsonb,
  strong_areas jsonb NOT NULL DEFAULT '[]'::jsonb,
  recommended_topics jsonb NOT NULL DEFAULT '[]'::jsonb,
  recommendations jsonb NOT NULL DEFAULT '{}'::jsonb,
  question_details jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.quiz_attempts TO authenticated;
GRANT ALL ON public.quiz_attempts TO service_role;

ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users view own quiz attempts" ON public.quiz_attempts
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "users insert own quiz attempts" ON public.quiz_attempts
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users delete own quiz attempts" ON public.quiz_attempts
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_quiz_attempts_user_created ON public.quiz_attempts(user_id, created_at DESC);
