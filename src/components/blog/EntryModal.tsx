import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Markdown } from "@/components/blog/Markdown";
import { categoryMeta, embedInfo, formatDate, type Post } from "@/lib/blog";

export function EntryModal({
  post,
  editMode,
  onClose,
  onTogglePin,
  onRemove,
  onTogglePublish,
}: {
  post: Post | null;
  editMode: boolean;
  onClose: () => void;
  onTogglePin: (post: Post) => void;
  onRemove: (post: Post) => void;
  onTogglePublish: (post: Post) => void;
}) {
  if (!post) return null;
  const cat = categoryMeta(post.category);
  const embed = embedInfo(post.embed_url);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[88vh] max-w-2xl overflow-y-auto rounded-2xl border-hairline bg-card p-0">
        <div className="h-1.5 w-full rounded-t-2xl" style={{ backgroundColor: cat.dot }} />
        <div className="p-7">
          <div className="meta flex flex-wrap items-center gap-2 text-ink-soft">
            <span style={{ color: cat.text }}>{cat.label}</span>
            <span className="text-hairline">/</span>
            <span>{formatDate(post.log_date, post.log_time)}</span>
            {post.pinned && (
              <>
                <span className="text-hairline">/</span>
                <span>Featured</span>
              </>
            )}
          </div>

          <h2 className="hand mt-3 text-4xl leading-tight text-ink">{post.title}</h2>

          {post.photoUrls.length > 0 && (
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {post.photoUrls.map((url) => (
                <a key={url} href={url} target="_blank" rel="noreferrer noopener">
                  <img
                    src={url}
                    alt=""
                    className="aspect-[4/3] w-full rounded-lg border border-hairline object-cover"
                  />
                </a>
              ))}
            </div>
          )}

          {embed && embed.kind !== "link" && (
            <div className="mt-6 aspect-video w-full overflow-hidden rounded-lg border border-hairline">
              <iframe
                src={embed.src}
                title={post.title}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}

          <Markdown text={post.body} className="mt-6 text-[0.95rem] text-ink" />

          {embed && embed.kind === "link" && (
            <a
              href={embed.src}
              target="_blank"
              rel="noreferrer noopener"
              className="mt-6 block truncate rounded-lg border border-hairline p-3 text-sm text-primary hover:bg-secondary"
            >
              {embed.src}
            </a>
          )}

          {post.links.length > 0 && (
            <div className="mt-6 border-t border-hairline pt-5">
              <p className="meta text-ink-soft">Links</p>
              <ul className="mt-3 space-y-2">
                {post.links.map((l) => (
                  <li key={l.url}>
                    <a
                      href={l.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="text-sm text-primary underline underline-offset-4 hover:opacity-70"
                    >
                      {l.label || l.url}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {editMode && (
            <div className="mt-8 flex flex-wrap gap-3 border-t border-hairline pt-5">
              <button
                type="button"
                onClick={() => onTogglePublish(post)}
                className="meta rounded-full border border-hairline px-4 py-2 text-ink hover:bg-secondary"
              >
                {post.published ? "Move back to drafts" : "Publish entry"}
              </button>
              <button
                type="button"
                onClick={() => onTogglePin(post)}
                className="meta rounded-full border border-hairline px-4 py-2 text-ink hover:bg-secondary"
              >
                {post.pinned ? "Unfeature this entry" : "Feature this entry"}
              </button>
              <button
                type="button"
                onClick={() => onRemove(post)}
                className="meta rounded-full border border-destructive/40 px-4 py-2 text-destructive hover:bg-destructive/5"
              >
                Remove entry
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
