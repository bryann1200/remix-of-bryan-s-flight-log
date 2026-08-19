import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import {
  CATEGORIES,
  fetchBanner,
  fetchPosts,
  formatDate,
  uploadMedia,
  type CategoryKey,
  type Post,
} from "@/lib/blog";
import { HeroFlightPath } from "@/components/blog/HeroFlightPath";
import { StickyNote } from "@/components/blog/StickyNote";
import { FlightLines } from "@/components/blog/FlightLines";
import { EntryModal } from "@/components/blog/EntryModal";
import { AuthModal } from "@/components/blog/AuthModal";
import { NewEntryModal } from "@/components/blog/NewEntryModal";

const TITLE = "Bryan's Super Interesting Adventures";
const DESCRIPTION =
  "A personal log of AI ventures, volunteering, and personal growth — pinned to a corkboard, one sticky note at a time.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: `${TITLE} — a personal log` },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const qc = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const [active, setActive] = useState<Post | null>(null);
  const boardRef = useRef<HTMLDivElement | null>(null);
  const pins = useRef<Map<string, HTMLDivElement>>(new Map());
  const bannerInput = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      qc.invalidateQueries({ queryKey: ["posts"] });
    });
    return () => sub.subscription.unsubscribe();
  }, [qc]);

  const editMode = !!session;

  const postsQuery = useQuery({ queryKey: ["posts"], queryFn: fetchPosts });
  const bannerQuery = useQuery({ queryKey: ["banner"], queryFn: fetchBanner });

  const allPosts = useMemo(() => postsQuery.data ?? [], [postsQuery.data]);
  const posts = useMemo(() => allPosts.filter((p) => p.published), [allPosts]);
  const drafts = useMemo(() => allPosts.filter((p) => !p.published), [allPosts]);

  const visible = posts;

  function refresh() {
    qc.invalidateQueries({ queryKey: ["posts"] });
  }

  async function publishPost(post: Post) {
    await supabase.from("posts").update({ published: true }).eq("id", post.id);
    refresh();
  }

  async function unpublishPost(post: Post) {
    await supabase.from("posts").update({ published: false }).eq("id", post.id);
    setActive(null);
    refresh();
  }

  async function removePost(post: Post) {
    if (!window.confirm(`Remove “${post.title}”?`)) return;
    await supabase.from("posts").delete().eq("id", post.id);
    setActive(null);
    refresh();
  }

  async function togglePin(post: Post) {
    await supabase.from("posts").update({ pinned: !post.pinned }).eq("id", post.id);
    setActive(null);
    refresh();
  }

  async function onBannerFile(file: File | undefined) {
    if (!file) return;
    const path = await uploadMedia(file);
    await supabase.from("site_settings").upsert({ id: 1, banner_url: path });
    qc.invalidateQueries({ queryKey: ["banner"] });
  }

  function scrollToBoard() {
    document.getElementById("board")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="frosted sticky top-0 z-40 border-b border-hairline">
        <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
          <a href="#top" className="text-sm font-semibold tracking-tight text-ink">
            Bryan&rsquo;s Adventures
          </a>
          <div className="hidden items-center gap-6 md:flex">
            {CATEGORIES.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => {
                  setCat(c.key);
                  scrollToBoard();
                }}
                className="meta text-ink-soft transition-colors hover:text-ink"
              >
                {c.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            {editMode && (
              <button
                type="button"
                onClick={() => setNewOpen(true)}
                className="rounded-full bg-ink px-4 py-1.5 text-sm font-medium text-background transition-opacity hover:opacity-85"
              >
                New entry
              </button>
            )}
            <button
              type="button"
              onClick={async () => {
                if (editMode) {
                  await supabase.auth.signOut();
                  qc.invalidateQueries({ queryKey: ["posts"] });
                } else {
                  setAuthOpen(true);
                }
              }}
              className="meta rounded-full border border-hairline px-3 py-2 text-ink-soft transition-colors hover:text-ink"
            >
              {editMode ? "Sign out" : "Sign in"}
            </button>
          </div>
        </nav>
      </header>

      <main id="top">
        {/* Banner */}
        {(bannerQuery.data?.url || editMode) && (
          <section className="mx-auto max-w-6xl px-5 pt-6">
            <div className="relative overflow-hidden rounded-2xl border border-hairline bg-secondary">
              {bannerQuery.data?.url ? (
                <img
                  src={bannerQuery.data.url}
                  alt="Banner"
                  className="h-40 w-full object-cover sm:h-60"
                />
              ) : (
                <div className="flex h-28 items-center justify-center">
                  <span className="meta text-ink-soft">No banner yet</span>
                </div>
              )}
              {editMode && (
                <>
                  <button
                    type="button"
                    onClick={() => bannerInput.current?.click()}
                    className="meta absolute right-3 top-3 rounded-full border border-hairline bg-card px-3 py-1.5 text-ink"
                  >
                    Replace banner
                  </button>
                  <input
                    ref={bannerInput}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => onBannerFile(e.target.files?.[0])}
                  />
                </>
              )}
            </div>
          </section>
        )}

        {/* Hero */}
        <section className="mx-auto max-w-6xl px-5 pb-4 pt-14 text-center sm:pt-20">
          <h1 className="mx-auto max-w-3xl text-4xl font-semibold tracking-tight text-ink sm:text-6xl">
            {TITLE}
          </h1>

          <HeroFlightPath onActivate={scrollToBoard} />
        </section>

        {/* Draft queue — owner only */}
        {editMode && (
          <section className="mx-auto mt-12 max-w-6xl px-5">
            <div className="rounded-2xl border border-hairline bg-card p-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold tracking-tight text-ink">
                  Draft queue{drafts.length > 0 ? ` · ${drafts.length}` : ""}
                </h2>
                <button
                  type="button"
                  onClick={() => setNewOpen(true)}
                  className="meta rounded-full border border-hairline px-3 py-2 text-ink-soft hover:text-ink"
                >
                  Write a draft
                </button>
              </div>
              {drafts.length === 0 ? (
                <p className="mt-3 text-sm text-ink-soft">
                  No drafts. Anything you save as a draft stays private until you publish it.
                </p>
              ) : (
                <ul className="mt-4 divide-y divide-hairline">
                  {drafts.map((post) => (
                    <li
                      key={post.id}
                      className="flex flex-wrap items-center justify-between gap-3 py-3"
                    >
                      <button
                        type="button"
                        onClick={() => setActive(post)}
                        className="text-left text-sm font-medium text-ink hover:opacity-70"
                      >
                        {post.title}
                        <span className="meta ml-2 text-ink-soft">
                          {formatDate(post.log_date, post.log_time)}
                        </span>
                      </button>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => publishPost(post)}
                          className="rounded-full bg-ink px-4 py-1.5 text-sm font-medium text-background transition-opacity hover:opacity-85"
                        >
                          Publish
                        </button>
                        <button
                          type="button"
                          onClick={() => removePost(post)}
                          className="meta rounded-full border border-hairline px-3 py-2 text-ink-soft hover:text-ink"
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        )}

        {/* Corkboard */}
        <section id="board" className="mx-auto max-w-6xl px-5 py-12">
          {postsQuery.isLoading ? (
            <p className="mt-10 text-sm text-ink-soft">Loading the board…</p>
          ) : visible.length === 0 ? (
            <div className="mt-12 rounded-2xl border border-dashed border-hairline p-14 text-center">
              <p className="hand text-3xl text-ink">Nothing pinned here yet</p>
            </div>
          ) : (
            <div ref={boardRef} className="relative mt-6">
              <FlightLines
                containerRef={boardRef}
                pins={pins}
                posts={visible}
                onWaypoint={(p) => setActive(p)}
              />
              <div className="relative z-10 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
                {visible.map((post, i) => (
                  <StickyNote
                    key={post.id}
                    post={post}
                    index={i}
                    editMode={editMode}
                    onOpen={() => setActive(post)}
                    onRemove={() => removePost(post)}
                    pinRef={(el) => {
                      if (el) pins.current.set(post.id, el);
                      else pins.current.delete(post.id);
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </section>
      </main>

      <footer className="border-t border-hairline">
        <div className="mx-auto max-w-6xl px-5 py-10">
          <p className="text-sm font-medium text-ink">{TITLE}</p>
        </div>
      </footer>

      <EntryModal
        post={active}
        editMode={editMode}
        onClose={() => setActive(null)}
        onTogglePin={togglePin}
        onRemove={removePost}
        onTogglePublish={(p) => (p.published ? unpublishPost(p) : publishPost(p))}
      />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      <NewEntryModal open={newOpen} onClose={() => setNewOpen(false)} onSaved={refresh} />
    </div>
  );
}

function Chip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`meta flex items-center gap-1.5 rounded-full border px-3 py-2 transition-colors ${
        active
          ? "border-ink bg-ink text-background"
          : "border-hairline text-ink-soft hover:text-ink"
      }`}
    >
      {label}
    </button>
  );
}
