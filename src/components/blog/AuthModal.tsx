import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";
import { OWNER_EMAIL } from "@/lib/blog";

// The Lovable OAuth broker (/~oauth/initiate) only exists on *.lovable.app and
// Lovable-managed custom domains. Anywhere else we use the standard Supabase
// OAuth redirect/callback flow, which works on any host.
function usesLovableBroker() {
  if (typeof window === "undefined") return false;
  return window.location.hostname.endsWith(".lovable.app");
}

export function AuthModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn() {
    setBusy(true);
    setError(null);

    if (!usesLovableBroker()) {
      const { error: err } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: { prompt: "select_account", login_hint: OWNER_EMAIL },
        },
      });
      if (err) {
        setBusy(false);
        setError("Google sign-in failed. Please try again.");
      }
      return;
    }

    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
      extraParams: { prompt: "select_account", login_hint: OWNER_EMAIL },
    });
    if (result.error) {
      setBusy(false);
      setError("Google sign-in failed. Please try again.");
      return;
    }

    if (result.redirected) return;
    setBusy(false);
    onClose();
  }


  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm rounded-2xl border-hairline bg-card p-7">
        <p className="meta text-ink-soft">Owner access</p>
        <h2 className="mt-2 text-xl font-bold tracking-tight text-ink">Sign in with Google</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Anyone can read the blog. Only {OWNER_EMAIL} can write, draft and publish.
        </p>

        {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

        <button
          type="button"
          onClick={signIn}
          disabled={busy}
          className="mt-6 w-full rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-85 disabled:opacity-50"
        >
          {busy ? "Opening Google…" : "Continue with Google"}
        </button>
      </DialogContent>
    </Dialog>
  );
}
