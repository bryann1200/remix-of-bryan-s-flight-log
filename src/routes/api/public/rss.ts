import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { sortPosts, toRss, type Post } from "@/lib/blog";

export const Route = createFileRoute("/api/public/rss")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const supabase = createClient<Database>(
          process.env["SUPABASE_URL"]!,
          process.env["SUPABASE_PUBLISHABLE_KEY"]!,
          { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
        );

        const { data, error } = await supabase
          .from("posts")
          .select("id,title,category,body,log_date,log_time,pinned,published,created_at");

        if (error) return new Response("Feed unavailable", { status: 500 });

        const posts = sortPosts(
          (data ?? []).map((r) => ({
            ...r,
            photos: [],
            photoUrls: [],
            banner: null,
            bannerUrl: null,
            links: [],
            embed_url: null,
          })) as Post[],
        );

        const origin = new URL(request.url).origin;
        return new Response(toRss(posts, origin), {
          headers: { "content-type": "application/rss+xml; charset=utf-8" },
        });
      },
    },
  },
});
