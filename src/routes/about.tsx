import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import {
  fetchProfile,
  isOwnerEmail,
  saveProfile,
  uploadMedia,
  type SocialLink,
} from "@/lib/blog";
import { Markdown } from "@/components/blog/Markdown";

const TITLE = "About Bryan";
const DESCRIPTION =
  "Who Bryan is, what he is building, and where to find him across the internet.";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: `${TITLE} — bio and social profiles` },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: About,
});

function About() {
  const qc = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const isOwner = isOwnerEmail(session?.user?.email);
  const profileQuery = useQuery({ queryKey: ["profile"], queryFn: fetchProfile });

  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState("");
  const [socials, setSocials] = useState<SocialLink[]>([]);
  const [avatarPath, setAvatarPath] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startEdit() {
    const p = profileQuery.data;
    setBio(p?.bio ?? "");
    setSocials(p?.socials?.length ? p.socials : [{ label: "", url: "" }]);
    setAvatarPath(p?.avatarPath ?? null);
    setError(null);
    setEditing(true);
  }

  async function save() {
    setBusy(true);
    setError(null);
    try {
      await saveProfile({
        bio: bio.trim(),
        socials: socials.filter((s) => s.url.trim()).map((s) => ({
          label: s.label.trim() || new URL(s.url.trim()).hostname.replace("www.", ""),
          url: s.url.trim(),
        })),
        avatarPath,
      });
      await qc.invalidateQueries({ queryKey: ["profile"] });
      setEditing(false);
    } catch {
      setError("Could not save. Check your links are full URLs (https://…).");
    } finally {
      setBusy(false);
    }
  }

  const profile = profileQuery.data;

  return (
    <div className="min-h-screen bg-background">
      <header className="frosted sticky top-0 z-40 border-b border-hairline">
        <nav className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-5 py-3">
          <Link to="/" className="text-sm font-semibold tracking-tight text-ink">
            Bryan&rsquo;s Adventures
          </Link>
          <Link to="/about" className="meta text-ink-soft hover:text-ink">
            About
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-3xl px-5 pb-24 pt-16">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <h1 className="text-4xl font-semibold tracking-tight text-ink sm:text-5xl">{TITLE}</h1>
          {isOwner && !editing && (
            <button
              type="button"
              onClick={startEdit}
              className="meta rounded-full border border-hairline px-3 py-2 text-ink-soft hover:text-ink"
            >
              Edit bio
            </button>
          )}
        </div>

        {editing ? (
          <div className="mt-8 space-y-5">
            <div>
              <label className="meta text-ink-soft" htmlFor="bio">
                Bio (markdown supported)
              </label>
              <textarea
                id="bio"
                rows={10}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="mt-1 w-full rounded-xl border border-hairline bg-card px-3 py-2 text-sm text-ink outline-none focus:border-primary"
              />
            </div>

            <div>
              <p className="meta text-ink-soft">Portrait</p>
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setAvatarPath(await uploadMedia(file));
                }}
                className="mt-1 text-sm text-ink-soft"
              />
            </div>

            <div className="space-y-3">
              <p className="meta text-ink-soft">Social profiles</p>
              {socials.map((s, i) => (
                <div key={i} className="flex flex-wrap gap-2">
                  <input
                    placeholder="Label (Instagram)"
                    value={s.label}
                    onChange={(e) =>
                      setSocials(socials.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))
                    }
                    className="w-40 rounded-lg border border-hairline bg-card px-3 py-2 text-sm text-ink outline-none focus:border-primary"
                  />
                  <input
                    placeholder="https://…"
                    value={s.url}
                    onChange={(e) =>
                      setSocials(socials.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))
                    }
                    className="min-w-0 flex-1 rounded-lg border border-hairline bg-card px-3 py-2 text-sm text-ink outline-none focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setSocials(socials.filter((_, j) => j !== i))}
                    className="meta rounded-full border border-hairline px-3 py-2 text-ink-soft hover:text-ink"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setSocials([...socials, { label: "", url: "" }])}
                className="meta rounded-full border border-hairline px-3 py-2 text-ink-soft hover:text-ink"
              >
                Add link
              </button>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={save}
                disabled={busy}
                className="rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-85 disabled:opacity-50"
              >
                {busy ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="meta rounded-full border border-hairline px-4 py-2 text-ink-soft hover:text-ink"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-8">
            {profile?.avatarUrl && (
              <img
                src={profile.avatarUrl}
                alt="Portrait of Bryan"
                className="mb-8 h-40 w-40 rounded-2xl border border-hairline object-cover"
              />
            )}
            {profile?.bio ? (
              <div className="text-base leading-relaxed text-ink">
                <Markdown source={profile.bio} />
              </div>
            ) : (
              <p className="text-base text-ink-soft">
                {isOwner
                  ? "No bio yet — hit “Edit bio” to write it."
                  : "Bryan hasn’t written his bio yet."}
              </p>
            )}

            {profile?.socials?.length ? (
              <ul className="mt-10 flex flex-wrap gap-2">
                {profile.socials.map((s) => (
                  <li key={s.url}>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noreferrer"
                      className="meta rounded-full border border-hairline px-4 py-2 text-ink-soft transition-colors hover:text-ink"
                    >
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        )}
      </main>
    </div>
  );
}
