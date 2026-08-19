ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS videos jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE TABLE IF NOT EXISTS public.categories (
  key text PRIMARY KEY,
  label text NOT NULL,
  color text NOT NULL DEFAULT '#0071E3',
  sort integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "categories readable by everyone" ON public.categories;
CREATE POLICY "categories readable by everyone" ON public.categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "owner manages categories" ON public.categories;
CREATE POLICY "owner manages categories" ON public.categories FOR ALL TO authenticated
  USING (public.is_owner()) WITH CHECK (public.is_owner());

INSERT INTO public.categories (key, label, color, sort) VALUES
  ('ai', 'AI Ventures', '#0071E3', 0),
  ('volunteer', 'Volunteering', '#2E7D4F', 1),
  ('growth', 'Personal Growth', '#C9760A', 2)
ON CONFLICT (key) DO NOTHING;