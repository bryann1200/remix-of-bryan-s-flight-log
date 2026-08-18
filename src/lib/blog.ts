import { supabase } from "@/integrations/supabase/client";

export type CategoryKey = "ai" | "volunteer" | "growth";

export type PostLink = { label: string; url: string };

export type Post = {
  id: string;
  title: string;
  category: CategoryKey;
  body: string;
  log_date: string;
  log_time: string | null;
  photos: string[];
  photoUrls: string[];
  links: PostLink[];
  embed_url: string | null;
  pinned: boolean;
  created_at: string;
};

export const CATEGORIES: {
  key: CategoryKey;
  label: string;
  dot: string;
  tint: string;
  text: string;
}[] = [
  {
    key: "ai",
    label: "AI Ventures",
    dot: "var(--cat-ai)",
    tint: "var(--cat-ai-tint)",
    text: "var(--cat-ai)",
  },
  {
    key: "volunteer",
    label: "Volunteering",
    dot: "var(--cat-volunteer)",
    tint: "var(--cat-volunteer-tint)",
    text: "var(--cat-volunteer)",
  },
  {
    key: "growth",
    label: "Personal Growth",
    dot: "var(--cat-growth)",
    tint: "var(--cat-growth-tint)",
    text: "var(--cat-growth)",
  },
];

export function categoryMeta(key: string) {
  return CATEGORIES.find((c) => c.key === key) ?? CATEGORIES[0];
}

const SIGNED_TTL = 60 * 60 * 24 * 7;

export async function signMedia(paths: string[]): Promise<Record<string, string>> {
  const unique = Array.from(new Set(paths.filter(Boolean)));
  if (unique.length === 0) return {};
  const remote = unique.filter((p) => !/^https?:\/\//.test(p));
  const map: Record<string, string> = {};
  for (const p of unique) if (!remote.includes(p)) map[p] = p;
  if (remote.length === 0) return map;
  const { data } = await supabase.storage.from("media").createSignedUrls(remote, SIGNED_TTL);
  for (const row of data ?? []) {
    if (row.path && row.signedUrl) map[row.path] = row.signedUrl;
  }
  return map;
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export function sortPosts(posts: Post[]): Post[] {
  return [...posts].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    const at = `${a.log_date} ${a.log_time ?? "00:00:00"}`;
    const bt = `${b.log_date} ${b.log_time ?? "00:00:00"}`;
    if (at !== bt) return at < bt ? 1 : -1;
    return a.created_at < b.created_at ? 1 : -1;
  });
}

export async function fetchPosts(): Promise<Post[]> {
  const { data, error } = await supabase.from("posts").select("*");
  if (error) throw error;
  const rows = data ?? [];
  const allPhotos = rows.flatMap((r) => asArray<string>(r.photos));
  const signed = await signMedia(allPhotos);
  return sortPosts(
    rows.map((r) => {
      const photos = asArray<string>(r.photos);
      return {
        id: r.id,
        title: r.title,
        category: r.category as CategoryKey,
        body: r.body,
        log_date: r.log_date,
        log_time: r.log_time,
        photos,
        photoUrls: photos.map((p) => signed[p] ?? p),
        links: asArray<PostLink>(r.links),
        embed_url: r.embed_url,
        pinned: r.pinned,
        created_at: r.created_at,
      };
    }),
  );
}

export async function fetchBanner(): Promise<{ path: string | null; url: string | null }> {
  const { data } = await supabase
    .from("site_settings")
    .select("banner_url")
    .eq("id", 1)
    .maybeSingle();
  const path = data?.banner_url ?? null;
  if (!path) return { path: null, url: null };
  const signed = await signMedia([path]);
  return { path, url: signed[path] ?? null };
}

export async function uploadMedia(file: File): Promise<string> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("media").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  return path;
}

export function formatDate(date: string, time: string | null) {
  const d = new Date(`${date}T${time ?? "00:00:00"}`);
  const day = d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  if (!time) return day;
  const hh = time.slice(0, 5);
  return `${day} · ${hh}`;
}

export function gapLabel(a: Post, b: Post) {
  const ta = new Date(`${a.log_date}T${a.log_time ?? "00:00:00"}`).getTime();
  const tb = new Date(`${b.log_date}T${b.log_time ?? "00:00:00"}`).getTime();
  const diff = Math.abs(ta - tb);
  const days = Math.round(diff / 86_400_000);
  if (days === 0) {
    const hours = Math.round(diff / 3_600_000);
    if (hours === 0) return "same moment";
    return `${hours} hour${hours === 1 ? "" : "s"} apart`;
  }
  if (days === 1) return "1 day later";
  if (days < 31) return `${days} days later`;
  const months = Math.round(days / 30);
  return `${months} month${months === 1 ? "" : "s"} later`;
}

export function embedInfo(url: string | null) {
  if (!url) return null;
  const yt = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/,
  );
  if (yt) return { kind: "youtube" as const, src: `https://www.youtube.com/embed/${yt[1]}` };
  const vm = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vm) return { kind: "vimeo" as const, src: `https://player.vimeo.com/video/${vm[1]}` };
  return { kind: "link" as const, src: url };
}

/** Deterministic small rotation from a post id, roughly -3.5deg to 3.5deg. */
export function tiltFor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 100000;
  return ((h % 700) / 100 - 3.5).toFixed(2);
}

export function toRss(posts: Post[], origin: string) {
  const items = posts
    .map(
      (p) => `    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${escapeXml(`${origin}/?entry=${p.id}`)}</link>
      <guid isPermaLink="false">${p.id}</guid>
      <pubDate>${new Date(`${p.log_date}T${p.log_time ?? "00:00:00"}`).toUTCString()}</pubDate>
      <category>${escapeXml(categoryMeta(p.category).label)}</category>
      <description>${escapeXml(p.body)}</description>
    </item>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Bryan's Super Interesting Adventures</title>
    <link>${escapeXml(origin)}</link>
    <description>A personal log of ventures, volunteering, and growth.</description>
${items}
  </channel>
</rss>`;
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
