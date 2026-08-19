import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES, uploadMedia, type CategoryKey, type PostLink } from "@/lib/blog";

const fieldClass =
  "mt-1 w-full rounded-lg border border-hairline bg-background px-3 py-2 text-sm text-ink outline-none focus:border-primary";

export function NewEntryModal({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<CategoryKey>("ai");
  const [logDate, setLogDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [logTime, setLogTime] = useState("");
  const [body, setBody] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [links, setLinks] = useState<PostLink[]>([]);
  const [embedUrl, setEmbedUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setTitle("");
    setCategory("ai");
    setLogDate(new Date().toISOString().slice(0, 10));
    setLogTime("");
    setBody("");
    setFiles([]);
    setLinks([]);
    setEmbedUrl("");
    setError(null);
  }

  async function save(publish: boolean) {
    setBusy(true);
    setError(null);
    try {
      const photos: string[] = [];
      for (const file of files) photos.push(await uploadMedia(file));
      const { error: err } = await supabase.from("posts").insert({
        title: title.trim(),
        category,
        body: body.trim(),
        log_date: logDate,
        log_time: logTime ? logTime : null,
        photos,
        links: links.filter((l) => l.url.trim() !== ""),
        embed_url: embedUrl.trim() || null,
        published: publish,
      });
      if (err) throw err;
      reset();
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
    void save(false);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[88vh] max-w-xl overflow-y-auto rounded-2xl border-hairline bg-card p-7">
        <p className="meta text-ink-soft">New log entry</p>
        <h2 className="mt-1 text-xl font-bold tracking-tight text-ink">Write an entry</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Save it as a draft to keep it private, or publish it straight to the board.
        </p>

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
                onChange={(e) => setCategory(e.target.value as CategoryKey)}
                className={fieldClass}
              >
                {CATEGORIES.map((c) => (
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

          <div>
            <label className="meta text-ink-soft" htmlFor="f-photos">
              Photos
            </label>
            <input
              id="f-photos"
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setFiles((prev) => [...prev, ...Array.from(e.target.files ?? [])])}
              className="mt-1 block w-full text-sm text-ink-soft file:mr-3 file:rounded-full file:border file:border-hairline file:bg-background file:px-3 file:py-1.5 file:text-sm file:text-ink"
            />
            {files.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {files.map((file, i) => (
                  <div key={`${file.name}-${i}`} className="relative">
                    <img
                      src={URL.createObjectURL(file)}
                      alt=""
                      className="h-16 w-16 rounded-md border border-hairline object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                      className="absolute -right-2 -top-2 h-5 w-5 rounded-full border border-hairline bg-card text-xs leading-none text-ink"
                      aria-label="Remove photo"
                    >
                      ×
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
              {busy ? "Saving…" : "Save as draft"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void save(true)}
              className="rounded-full bg-ink px-5 py-2 text-sm font-medium text-background transition-opacity hover:opacity-85 disabled:opacity-50"
            >
              {busy ? "Saving…" : "Publish now"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
