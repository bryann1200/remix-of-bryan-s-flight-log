CREATE TABLE public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text NOT NULL CHECK (category IN ('ai','volunteer','growth')),
  body text NOT NULL,
  log_date date NOT NULL DEFAULT current_date,
  log_time time NULL,
  photos jsonb NOT NULL DEFAULT '[]'::jsonb,
  links jsonb NOT NULL DEFAULT '[]'::jsonb,
  embed_url text NULL,
  pinned boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.posts TO authenticated;
GRANT ALL ON public.posts TO service_role;

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Posts are publicly readable" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Owners can insert posts" ON public.posts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Owners can update posts" ON public.posts FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Owners can delete posts" ON public.posts FOR DELETE TO authenticated USING (true);

CREATE TABLE public.site_settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  banner_url text NULL
);

GRANT SELECT ON public.site_settings TO anon;
GRANT SELECT, INSERT, UPDATE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Settings are publicly readable" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Owners can insert settings" ON public.site_settings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Owners can update settings" ON public.site_settings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

INSERT INTO public.site_settings (id, banner_url) VALUES (1, NULL);

INSERT INTO public.posts (title, category, body, log_date, log_time, pinned) VALUES
('Shipped the first agent prototype', 'ai', 'Spent the weekend wiring a small **retrieval agent** over my own notes. It finally answered a question I could not answer myself.\n\nNext step: evaluation harness before adding more tools.', '2026-08-14', '21:30', true),
('Saturday at the food bank', 'volunteer', 'Packed *312 boxes* with the morning crew. Learned that the bottleneck is never the packing — it is the sorting table.', '2026-08-08', '09:00', false),
('Ninety days of early mornings', 'growth', 'Ninety consecutive days up before six. The habit stopped being a decision somewhere around day forty.\n\nSee [the tracker](https://example.com) for the boring details.', '2026-07-30', NULL, false);