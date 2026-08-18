import { categoryMeta, formatDate, tiltFor, type Post } from "@/lib/blog";
import { plainExcerpt } from "@/components/blog/Markdown";

type Props = {
  post: Post;
  index: number;
  editMode: boolean;
  onOpen: () => void;
  onRemove: () => void;
  pinRef: (el: HTMLDivElement | null) => void;
};

export function StickyNote({ post, index, editMode, onOpen, onRemove, pinRef }: Props) {
  const cat = categoryMeta(post.category);
  const tilt = tiltFor(post.id);

  return (
    <div
      className="group relative pt-3"
      style={{
        animation: "note-in 0.5s cubic-bezier(0.22,1,0.36,1) both",
        animationDelay: `${Math.min(index, 12) * 55}ms`,
      }}
    >
      <article
        onClick={onOpen}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onOpen();
          }
        }}
        className="relative flex h-full cursor-pointer flex-col rounded-tl-[2px] rounded-tr-[18px] rounded-br-[2px] rounded-bl-[18px] border border-hairline/70 p-5 pt-7 shadow-note transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-note-lift focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        style={{
          backgroundColor: cat.tint,
          transform: `rotate(${tilt}deg)`,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = "rotate(0deg)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = `rotate(${tilt}deg)`)}
      >
        {post.pinned && (
          <span className="meta absolute right-4 top-3 text-ink-soft">Featured</span>
        )}

        <div
          ref={pinRef}
          aria-hidden
          className="absolute left-1/2 top-0 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background: `radial-gradient(circle at 32% 28%, color-mix(in oklab, ${cat.dot} 45%, white), ${cat.dot})`,
            boxShadow: "var(--shadow-pin)",
          }}
        />

        <div className="meta flex flex-wrap items-center gap-2 text-ink-soft">
          <span
            className="inline-block h-[7px] w-[7px] rounded-full"
            style={{ backgroundColor: cat.dot }}
          />
          <span style={{ color: cat.text }}>{cat.label}</span>
          <span className="text-hairline">/</span>
          <span>{formatDate(post.log_date, post.log_time)}</span>
        </div>

        <h3 className="hand mt-2 text-[1.75rem] leading-[1.15] text-ink">{post.title}</h3>

        <p className="mt-2 text-[0.875rem] leading-relaxed text-ink-soft">
          {plainExcerpt(post.body)}
        </p>

        {post.photoUrls.length > 0 && (
          <div className="mt-4 flex gap-2">
            {post.photoUrls.slice(0, 3).map((url, i) => (
              <div
                key={url}
                className="h-14 w-14 overflow-hidden rounded-[3px] border border-hairline bg-card p-[3px] shadow-note"
                style={{ transform: `rotate(${(i - 1) * 4}deg)` }}
              >
                <img src={url} alt="" className="h-full w-full rounded-[2px] object-cover" />
              </div>
            ))}
          </div>
        )}

        {(post.links.length > 0 || post.embed_url) && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {post.embed_url && (
              <span className="meta rounded-full border border-hairline bg-card px-2 py-1 text-ink-soft">
                Embed
              </span>
            )}
            {post.links.slice(0, 2).map((l) => (
              <span
                key={l.url}
                className="meta max-w-[10rem] truncate rounded-full border border-hairline bg-card px-2 py-1 text-ink-soft"
              >
                {l.label || "Link"}
              </span>
            ))}
          </div>
        )}

        <div className="mt-5 flex items-center justify-between border-t border-hairline/70 pt-3">
          <span className="meta text-ink">Read entry →</span>
          {editMode && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="meta text-destructive hover:opacity-70"
            >
              Remove
            </button>
          )}
        </div>
      </article>
    </div>
  );
}
