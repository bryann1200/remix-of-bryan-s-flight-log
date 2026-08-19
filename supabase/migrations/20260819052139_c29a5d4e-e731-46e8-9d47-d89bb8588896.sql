ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS socials jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS avatar_url text;

INSERT INTO public.site_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT lower(coalesce((auth.jwt() ->> 'email'), '')) = 'minbryan77@gmail.com'
$$;

DROP POLICY IF EXISTS "Owners can read all posts" ON public.posts;
DROP POLICY IF EXISTS "Owners can update posts" ON public.posts;
DROP POLICY IF EXISTS "Owners can insert posts" ON public.posts;
DROP POLICY IF EXISTS "Owners can delete posts" ON public.posts;
DROP POLICY IF EXISTS "Owners can update settings" ON public.site_settings;
DROP POLICY IF EXISTS "Owners can insert settings" ON public.site_settings;

CREATE POLICY "Owner can read all posts" ON public.posts FOR SELECT TO authenticated USING (public.is_owner());
CREATE POLICY "Owner can insert posts" ON public.posts FOR INSERT TO authenticated WITH CHECK (public.is_owner());
CREATE POLICY "Owner can update posts" ON public.posts FOR UPDATE TO authenticated USING (public.is_owner()) WITH CHECK (public.is_owner());
CREATE POLICY "Owner can delete posts" ON public.posts FOR DELETE TO authenticated USING (public.is_owner());
CREATE POLICY "Owner can insert settings" ON public.site_settings FOR INSERT TO authenticated WITH CHECK (public.is_owner());
CREATE POLICY "Owner can update settings" ON public.site_settings FOR UPDATE TO authenticated USING (public.is_owner()) WITH CHECK (public.is_owner());