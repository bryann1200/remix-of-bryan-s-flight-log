import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

export function AuthModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"in" | "up">("in");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const fn =
      mode === "in"
        ? supabase.auth.signInWithPassword({ email, password })
        : supabase.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: window.location.origin },
          });
    const { error: err } = await fn;
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    setEmail("");
    setPassword("");
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm rounded-2xl border-hairline bg-card p-7">
        <p className="meta text-ink-soft">Owner access</p>
        <h2 className="mt-2 text-xl font-semibold tracking-tight text-ink">
          {mode === "in" ? "Unlock editing" : "Create the owner account"}
        </h2>
        <p className="mt-1 text-sm text-ink-soft">
          Reading is open to everyone. Writing requires the owner account.
        </p>

        <form onSubmit={submit} className="mt-5 space-y-3">
          <div>
            <label className="meta text-ink-soft" htmlFor="auth-email">
              Email
            </label>
            <input
              id="auth-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-hairline bg-background px-3 py-2 text-sm text-ink outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="meta text-ink-soft" htmlFor="auth-password">
              Password
            </label>
            <input
              id="auth-password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-hairline bg-background px-3 py-2 text-sm text-ink outline-none focus:border-primary"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-85 disabled:opacity-50"
          >
            {busy ? "Working…" : mode === "in" ? "Unlock" : "Create account"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setMode(mode === "in" ? "up" : "in")}
          className="meta mt-4 text-ink-soft hover:text-ink"
        >
          {mode === "in" ? "First time? Create the owner account" : "Back to unlock"}
        </button>
      </DialogContent>
    </Dialog>
  );
}
