# Remix of Bryan's Flight Log

Build a personal blog called “Bryan’s Super Interesting Adventures” — an Apple-style personal log for tracking AI ventures, volunteering, and personal growth. Clean, minimal, product-page aesthetic (think apple.com), with one playful signature element: entries are displayed as sticky notes pinned to a corkboard.

Design system

	•	Colors: paper white background #FBFBFD, ink black text #1D1D1F, soft gray secondary text #6E6E73, hairline borders #D2D2D7. Accent blue #0071E3.

	•	Category colors: AI Ventures = blue #0071E3 (tint #EAF4FF), Volunteering = green #2E7D4F (tint #E9F8EF), Personal Growth = amber #C9760A (tint #FFF3E0).

	•	Typography: system font stack (-apple-system, SF Pro Display, Segoe UI). Headlines bold, tight letter-spacing, no gradient text effects — solid ink color only. Entry titles on sticky notes use a handwritten font (Google Font “Caveat”, weight 600–700). Meta text (dates, categories) in monospace, uppercase, small, letter-spaced.

	•	No emoji anywhere in the UI. Use plain text labels or simple line-drawn SVG icons instead.

	•	Nav: fixed top, frosted glass blur background, logo mark + site name on the left, links + Unlock/Lock button + New Entry button on the right.

	•	Hero: centered, large bold title “Bryan’s Super Interesting Adventures”, subtitle: “A running record of AI ventures, volunteering, and personal growth — logged as it happens.” Below it, an animated SVG signature: a hand-drawn flight-path line that draws itself in on page load (stroke-dasharray animation), with small mono-font labels “SGT · GROUND” and “CRUISE ALT.” at each end, and a dot at the end that fades in after the line finishes drawing.

	•	Stats row: below the hero, four centered numbers — total entries, and counts per category — with small uppercase labels underneath.

	•	Banner (optional): a full-width image strip below the nav, above the hero, that the owner can upload/replace/remove. If unset, show nothing (locked view) or a subtle “+ Add a banner image” dashed placeholder (unlocked view only).

Entries — the corkboard

	•	Entries render as a responsive grid of sticky notes, not generic cards.

	•	Each note: light category-tinted background, asymmetric rounded corners (sharp on two, rounded on two — like hand-cut paper), a small circular “push-pin” ornament centered at the top (radial gradient dot in the category color, drop shadow), and a slight random rotation (deterministic per entry ID, roughly -3.5° to 3.5°) that straightens out and lifts slightly on hover.

	•	Note contents: category dot + label + date (+ optional time) in mono caps, handwritten-font title, plain-text excerpt, up to 3 small rotated “polaroid” photo thumbnails if photos exist, small chips for links/embeds if present, and a footer with “Read entry →” plus a “Remove” button (edit mode only).

	•	If an entry is featured/pinned to the top, show a small uppercase “Featured” label in the corner — plain text, no icon.

	•	Clicking a note opens a detail modal: full title, meta, photo gallery, inline video embed if applicable (YouTube/Vimeo), markdown-rendered body text, a list of links, and (edit mode only) “Feature this entry” / “Remove entry” buttons.

Filtering & search

	•	Sticky filter bar below the hero: pill buttons for “All entries”, “AI Ventures”, “Volunteering”, “Personal Growth” (active pill filled dark).

	•	A search box next to the pills that live-filters entries by title and body text, combined with the active category filter.

New entry form (modal)

Fields:

	•	Title (text, required)

	•	Category (select: AI Ventures / Volunteering / Personal Growth)

	•	Date (date picker, required, defaults to today)

	•	Time (optional time picker)

	•	Entry body (textarea, required, supports lightweight markdown: **bold**, *italic*, [link text](url), line breaks)

	•	Photos (multiple file upload, with thumbnail preview and per-photo remove button before saving)

	•	Links (repeatable label + URL rows, add/remove)

	•	Embed URL (single field — auto-detect YouTube/Vimeo links and embed them inline in the detail view; any other URL shows as a plain link card)

Access model

	•	The site loads locked / read-only by default — no New Entry button, no delete buttons, no banner edit control. This makes it safe to share the link publicly.

	•	An “Unlock” button in the nav opens a passcode prompt. Correct passcode switches the UI into edit mode (shows New Entry, Remove buttons, Feature toggle, banner edit) for the session. A “Lock” button re-locks it.

	•	Note: this should be a real authentication gate if possible (e.g. Supabase Auth with a single owner account), not just a client-side passcode check, since a client-side-only check is trivially bypassed by anyone reading the page source.

Footer

	•	Small sync/connection status indicator.

	•	“Export JSON”, “Export RSS feed”, and “Copy share link” buttons.

	•	Tagline: “Bryan’s Super Interesting Adventures — a personal log of ventures, volunteering, and growth.”

Data model (use Supabase)

posts table:

	•	id (uuid, primary key, default gen_random_uuid())

	•	title (text, required)

	•	category (text, required, check in ai / volunteer / growth)

	•	body (text, required)

	•	log_date (date, required, default current_date)

	•	log_time (time, nullable)

	•	photos (jsonb, default [] — array of public image URLs)

	•	links (jsonb, default [] — array of {label, url})

	•	embed_url (text, nullable)

	•	pinned (boolean, default false — featured flag)

	•	created_at (timestamptz, default now())

site_settings table:

	•	id (int, primary key, fixed at 1)

	•	banner_url (text, nullable)

Storage: a public bucket for photo and banner uploads.

Row-level security: allow public read for both tables. Writes (insert/update/delete on posts, update on site_settings) should ideally be restricted to an authenticated owner rather than fully public — set this up with Supabase Auth if you support it, otherwise leave writes open but flag this as a known limitation.

Behavior notes

	•	Entries sort with featured/pinned entries first, then by date descending (most recent first), respecting the optional time when present.

	•	Empty state (no entries, or no results matching filter/search): a simple line-drawn icon (no emoji), “No entries yet” heading, and a short supporting line — no clutter.

	•	Fully responsive down to mobile widths; sticky note grid reflows to a single column, filter bar and forms stack vertically.

	•	Smooth, restrained motion only: note entrance animation (fade + rise, staggered), hover lift/straighten on notes, modal fade/scale-in. Respect prefers-reduced-motion.

Interactive flight path — hero

Make the hero’s animated flight-path line respond to the visitor, not just play once on load:

	•	Cursor response: as the pointer moves within the hero, the line should subtly bend toward the cursor — a gentle magnetic curve, not a wild distortion. Use a spring/easing transition (e.g. framer-motion or a lerped SVG path) so it settles smoothly rather than snapping.

	•	Hover marker: while hovering near the path, show a small marker (a dot, like a plane icon reduced to a simple shape — no emoji) that travels along the curve to the nearest point under the cursor, with a small mono-font label near it showing a flavor readout (e.g. an altitude-style number that ticks based on cursor position, like “ALT 3,240 FT” or “HDG 072°” — cosmetic, not tied to real data).

	•	Click-through: clicking anywhere on the flight path scrolls smoothly down to the entries section (same behavior as “Entries” in the nav).

	•	Reduced motion: fall back to the static drawn-in line with no pointer interaction if prefers-reduced-motion is set.

Flight lines connecting entries on the corkboard

Add a second, optional flight-path layer that visually threads the entries together in the order they’re displayed:

	•	Draw a single continuous line (dashed or thin solid, accent blue, low opacity so it doesn’t fight the sticky notes) connecting the push-pin point at the top of each visible note, in current sort order (featured first, then by date/time). Think “connect the dots” across a corkboard, like a route on a flight log.

	•	The line must be recalculated dynamically: whenever the entry list changes (filter, search, resize, new entry added, window resize), re-measure each visible note’s pin position (e.g. via getBoundingClientRect relative to the grid container) and redraw the SVG path so it always matches the current layout — including reflow to a single column on mobile.

	•	Interactive legs: hovering a segment between two consecutive notes highlights that segment (slightly thicker/brighter) and shows a small floating label with the time gap between the two entries (e.g. “3 days later”). Clicking a waypoint (a note’s pin) opens that entry’s detail modal, same as clicking the note itself.

	•	Because this can get visually busy with many entries, add a small toggle near the filter bar — “Show flight path” — off by default, or auto-disabled above a reasonable entry count (e.g. more than ~20 visible), user’s choice which.

	•	Keep the line strictly decorative/behind the notes in z-index so it never blocks clicking or reading a note.

	•	Respect prefers-reduced-motion: keep the connecting line static (no animated draw-in on every re-render) if set.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/8e13edd9-ecfb-4941-b3fc-2a78e76e68b2).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
