ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS published boolean NOT NULL DEFAULT false;
UPDATE public.posts SET published = true WHERE published = false;
ALTER TABLE public.posts ALTER COLUMN published SET DEFAULT false;

DROP POLICY IF EXISTS "Posts are publicly readable" ON public.posts;
CREATE POLICY "Published posts are publicly readable"
  ON public.posts FOR SELECT
  TO anon, authenticated
  USING (published = true);
CREATE POLICY "Owners can read all posts"
  ON public.posts FOR SELECT
  TO authenticated
  USING (true);

GRANT SELECT ON public.posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.posts TO authenticated;
GRANT ALL ON public.posts TO service_role;