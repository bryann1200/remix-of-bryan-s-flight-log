import { useState } from "react";
import { toast } from "sonner";
import { sharePost } from "@/lib/share-card";
import type { Post } from "@/lib/blog";

export function ShareButton({
  post,
  className,
  label = "Share",
}: {
  post: Post;
  className?: string;
  label?: string;
}) {
  const [busy, setBusy] = useState(false);

  const onShare = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const result = await sharePost(post);
      if (result === "downloaded") toast("Image downloaded — share it manually");
    } catch {
      toast.error("Couldn't create the share card");
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        void onShare();
      }}
      disabled={busy}
      className={className}
    >
      {busy ? "Creating…" : label}
    </button>
  );
}
