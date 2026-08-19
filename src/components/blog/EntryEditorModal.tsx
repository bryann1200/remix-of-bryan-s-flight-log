import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import {
  uploadMedia,
  type Category,
  type Post,
  type PostLink,
} from "@/lib/blog";

const fieldClass =
  "mt-1 w-full rounded-lg border border-hairline bg-background px-3 py-2 text-sm text-ink outline-none focus:border-primary";

const fileClass =
  "mt-1 block w-full text-sm text-ink-soft file:mr-3 file:rounded-full file:border file:border-hairline file:bg-background file:px-3 file:py-1.5 file:text-sm file:text-ink";

export function EntryEditorModal({
  open,
  post,
  categories,
  onClose,
  onSaved,
}: {
  open: boolean;
  post?: Post | null;
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const editing = Boolean(post);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>(categories[0]?.key ?? "ai");
  const [logDate, setLogDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [logTime, setLogTime] = useState("");
  const [body, setBody] = useState("");
  const [pinned, setPinned] = useState(false);
  const [photoPaths, setPhotoPaths] = useState<string[]>([]);
  const [videoPaths, setVideoPaths] = useState<string[]>([]);
  const [newPhotos, setNewPhotos] = useState<File[]>([]);
  const [newVideos, setNewVideos] = useState<File[]>([]);
  const [bannerPath, setBannerPath] = useState<string | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [links, setLinks] = useState<PostLink[]>([]);
  const [embedUrl, setEmbedUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setNewPhotos([]);
    setNewVideos([]);
    setBannerFile(null);
    if (post) {
      setTitle(post.title);
      setCategory(post.category);
      setLogDate(post.log_date);
      setLogTime(post.log_time ? post.log_time.slice(0, 5) : "");
      setBody(post.body);
      setPinned(post.pinned);
      setPhotoPaths(post.photos);
      setVideoPaths(post.videos);
      setBannerPath(post.banner);
      setLinks(post.links);
      setEmbedUrl(post.embed_url ?? "");
    } else {
      setTitle("");
      setCategory(categories[0]?.key ?? "ai");
      setLogDate(new Date().toISOString().slice(0, 10));
      setLogTime("");
      setBody("");
      setPinned(false);
      setPhotoPaths([]);
      setVideoPaths([]);
      setBannerPath(null);
      setLinks([]);
      setEmbedUrl("");
    }
  }, [open, post, categories]);

  async function save(publish: boolean | null) {
    setBusy(true);
    setError(null);
    try {
      const photos = [...photoPaths];
      for (const file of newPhotos) photos.push(await uploadMedia(file));
      const videos = [...videoPaths];
      for (const file of newVideos) videos.push(await uploadMedia(file));
      const banner = bannerFile ? await uploadMedia(bannerFile) : bannerPath;

      const payload = {
        title: title.trim(),
        category,
        body: body.trim(),
        log_date: logDate,
        log_time: logTime ? logTime : null,
        photos,
        videos,
        banner,
        pinned,
        links: links.filter((l) => l.url.trim() !== ""),
        embed_url: embedUrl.trim() || null,
      };

      if (post) {
        const update =
          publish === null ? payload : { ...payload, published: publish };
        const { error: err } = await supabase.from("posts").update(update).eq("id", post.id);
        if (err) throw err;
      } else {
        const { error: err } = await supabase
          .from("posts")
          .insert({ ...payload, published: publish === true });
        if (err) throw err;
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the entry.");
    } finally {
      setBusy(false);
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    void save(editing ? null : false);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[88vh] max-w-xl overflow-y-auto rounded-2xl border-hairline bg-card p-7">
        <p className="meta text-ink-soft">{editing ? "Edit entry" : "New log entry"}</p>
        <h2 className="mt-1 text-xl font-bold tracking-tight text-ink">
          {editing ? title || "Edit this entry" : "Write an entry"}
        </h2>

        <form onSubmit={submit} className="mt-5 space-y-4">
          <div>
            <label className="meta text-ink-soft" htmlFor="f-title">
              Title
            </label>
            <input
              id="f-title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={fieldClass}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="meta text-ink-soft" htmlFor="f-cat">
                Category
              </label>
              <select
                id="f-cat"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={fieldClass}
              >
                {categories.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="meta text-ink-soft" htmlFor="f-date">
                Date
              </label>
              <input
                id="f-date"
                type="date"
                required
                value={logDate}
                onChange={(e) => setLogDate(e.target.value)}
                className={fieldClass}
              />
            </div>
            <div>
              <label className="meta text-ink-soft" htmlFor="f-time">
                Time (optional)
              </label>
              <input
                id="f-time"
                type="time"
                value={logTime}
                onChange={(e) => setLogTime(e.target.value)}
                className={fieldClass}
              />
            </div>
          </div>

          <div>
            <label className="meta text-ink-soft" htmlFor="f-body">
              Entry body
            </label>
            <textarea
              id="f-body"
              required
              rows={7}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="**bold**, *italic*, [link text](url), line breaks"
              className={`${fieldClass} resize-y`}
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={pinned}
              onChange={(e) => setPinned(e.target.checked)}
            />
            Pin this log to the top of the board
          </label>

          <div>
            <label className="meta text-ink-soft" htmlFor="f-banner">
              Banner photo or video
            </label>
            <input
              id="f-banner"
              type="file"
              accept="image/*,video/*"
              onChange={(e) => setBannerFile(e.target.files?.[0] ?? null)}
              className={fileClass}
            />
            {(bannerFile || bannerPath) && (
              <button
                type="button"
                onClick={() => {
                  setBannerFile(null);
                  setBannerPath(null);
                }}
                className="meta mt-2 rounded-full border border-hairline px-3 py-1.5 text-ink-soft hover:text-ink"
              >
                Remove banner
              </button>
            )}
          </div>

          <div>
            <label className="meta text-ink-soft" htmlFor="f-photos">
              Photos
            </label>
            <input
              id="f-photos"
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setNewPhotos((p) => [...p, ...Array.from(e.target.files ?? [])])}
              className={fileClass}
            />
            {(photoPaths.length > 0 || newPhotos.length > 0) && (
              <div className="mt-2 space-y-1">
                {photoPaths.map((p, i) => (
                  <div key={p} className="flex items-center justify-between text-sm text-ink-soft">
                    <span className="truncate">{p}</span>
                    <button
                      type="button"
                      onClick={() => setPhotoPaths((prev) => prev.filter((_, j) => j !== i))}
                      className="meta text-destructive"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                {newPhotos.map((f, i) => (
                  <div
                    key={`${f.name}-${i}`}
                    className="flex items-center justify-between text-sm text-ink-soft"
                  >
                    <span className="truncate">{f.name}</span>
                    <button
                      type="button"
                      onClick={() => setNewPhotos((prev) => prev.filter((_, j) => j !== i))}
                      className="meta text-destructive"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="meta text-ink-soft" htmlFor="f-videos">
              Videos
            </label>
            <input
              id="f-videos"
              type="file"
              accept="video/*"
              multiple
              onChange={(e) => setNewVideos((p) => [...p, ...Array.from(e.target.files ?? [])])}
              className={fileClass}
            />
            {(videoPaths.length > 0 || newVideos.length > 0) && (
              <div className="mt-2 space-y-1">
                {videoPaths.map((p, i) => (
                  <div key={p} className="flex items-center justify-between text-sm text-ink-soft">
                    <span className="truncate">{p}</span>
                    <button
                      type="button"
                      onClick={() => setVideoPaths((prev) => prev.filter((_, j) => j !== i))}
                      className="meta text-destructive"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                {newVideos.map((f, i) => (
                  <div
                    key={`${f.name}-${i}`}
                    className="flex items-center justify-between text-sm text-ink-soft"
                  >
                    <span className="truncate">{f.name}</span>
                    <button
                      type="button"
                      onClick={() => setNewVideos((prev) => prev.filter((_, j) => j !== i))}
                      className="meta text-destructive"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <span className="meta text-ink-soft">Links</span>
            <div className="mt-2 space-y-2">
              {links.map((link, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    placeholder="Label"
                    value={link.label}
                    onChange={(e) =>
                      setLinks((prev) =>
                        prev.map((l, j) => (j === i ? { ...l, label: e.target.value } : l)),
                      )
                    }
                    className={`${fieldClass} mt-0 w-1/3`}
                  />
                  <input
                    placeholder="https://"
                    value={link.url}
                    onChange={(e) =>
                      setLinks((prev) =>
                        prev.map((l, j) => (j === i ? { ...l, url: e.target.value } : l)),
                      )
                    }
                    className={`${fieldClass} mt-0 flex-1`}
                  />
                  <button
                    type="button"
                    onClick={() => setLinks((prev) => prev.filter((_, j) => j !== i))}
                    className="meta shrink-0 rounded-lg border border-hairline px-3 text-ink-soft hover:bg-secondary"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setLinks((prev) => [...prev, { label: "", url: "" }])}
              className="meta mt-2 rounded-full border border-hairline px-3 py-1.5 text-ink hover:bg-secondary"
            >
              Add link
            </button>
          </div>

          <div>
            <label className="meta text-ink-soft" htmlFor="f-embed">
              Embed URL (YouTube / Vimeo)
            </label>
            <input
              id="f-embed"
              value={embedUrl}
              onChange={(e) => setEmbedUrl(e.target.value)}
              placeholder="https://"
              className={fieldClass}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2 border-t border-hairline pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-hairline px-4 py-2 text-sm text-ink hover:bg-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="rounded-full border border-hairline px-5 py-2 text-sm font-medium text-ink hover:bg-secondary disabled:opacity-50"
            >
              {busy ? "Saving…" : editing ? "Save changes" : "Save as draft"}
            </button>
            {(!editing || !post?.published) && (
              <button
                type="button"
                disabled={busy}
                onClick={() => void save(true)}
                className="rounded-full bg-ink px-5 py-2 text-sm font-medium text-background transition-opacity hover:opacity-85 disabled:opacity-50"
              >
                {busy ? "Saving…" : "Publish now"}
              </button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}