# Finish the corkboard blog page

Backend, design system, and all modal/note components are already built. What remains is the page shell and assembly so the site actually renders at `/`.

## What gets built

1. **Top navigation** — frosted sticky bar with the site title "Bryan's Super Interesting Adventures", category links, search entry point, and a lock/unlock control that opens the sign-in modal (shows "Owner mode" once unlocked).

2. **Hero section** — headline, one-line intro, and the interactive flight-path animation already built, plus a stats strip (total entries, entries per category, most recent log date).

3. **Banner** — optional wide image pulled from site settings, shown above the hero; in owner mode a small control lets Bryan upload/replace it.

4. **Filter bar** — sticky under the nav: category chips (All / AI Ventures / Volunteering / Personal Growth), a text search over title and body, and a sort toggle (newest / oldest). Shows a count of matching entries and an empty state when nothing matches.

5. **Corkboard grid** — responsive sticky-note grid (1 / 2 / 3 columns) using the existing note component, with the flight-line SVG layer threading pins together. Clicking a note opens the detail modal; clicking a line's waypoint jumps to that entry. Owner mode reveals "New entry" and per-note remove actions.

6. **Footer** — small print, category legend, and an RSS link.

7. **Page metadata** — real title, description, and social tags for the home route (replacing the placeholder "Lovable App" defaults).

## Technical notes

- `src/routes/index.tsx` replaces the placeholder: loads posts + banner through TanStack Query, holds filter/search/sort state, session state via the auth listener, and the pin-element ref map that the flight-line layer measures.
- Auth state uses the browser Supabase client with `onAuthStateChange`; owner-only UI is presentational — writes are already protected by row-level security.
- Filtering/sorting happens client-side over the fetched list; entry creation, deletion, and banner upload invalidate the posts/banner queries.
- An RSS route serves the feed from the existing `toRss` helper.
- No schema or component-API changes; all new work is layout and state wiring.
