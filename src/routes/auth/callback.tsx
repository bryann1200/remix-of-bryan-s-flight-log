import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/callback")({
  head: () => ({
    meta: [
      { title: "Signing you in — Bryan's Super Interesting Adventures" },
      { name: "description", content: "Completing the Google sign-in for the corkboard blog." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Signing you in" },
      { property: "og:description", content: "Completing the Google sign-in." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthCallback,
});

function AuthCallback() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let done = false;

    async function finish() {
      const url = new URL(window.location.href);
      const errDesc = url.searchParams.get("error_description");
      if (errDesc) {
        setError(errDesc);
        return;
      }

      const code = url.searchParams.get("code");
      if (code) {
        const { error: err } = await supabase.auth.exchangeCodeForSession(code);
        if (err) {
          setError(err.message);
          return;
        }
      } else {
        // Implicit flow: the client picks the session out of the URL hash.
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          setError("No sign-in details were returned.");
          return;
        }
      }

      if (!done) router.navigate({ to: "/", replace: true });
    }

    void finish();
    return () => {
      done = true;
    };
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 text-center">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          {error ? "Sign-in failed" : "Signing you in…"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {error ?? "One moment while we finish setting up your session."}
        </p>
        {error && (
          <a href="/" className="mt-6 inline-block text-sm font-medium underline">
            Back to the board
          </a>
        )}
      </div>
    </div>
  );
}
