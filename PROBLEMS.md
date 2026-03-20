# Problems & Solutions

User problems this codebase solves, mapped to their implementations.

---

## "On my phone the app looks broken when I first open it — no burger menu, no proper layout"

On mobile (iPhone 12 mini and similar), the first page load showed the app header without a burger menu and the layout appeared unstyled. Only after a manual reload did the correct mobile layout appear with the burger menu icon and proper viewport padding.

**Implementation:** The root cause was `useIsMobile()` returning `false` during SSR/hydration (value is set in `useEffect`). `AppHeaderBar` used a JS conditional (`isMobile && <Button>`) to render the burger menu, so it was absent from the server-rendered HTML on mobile. Fix: the burger menu button is now always rendered and hidden on desktop via CSS (`md:hidden` class), ensuring it is present in the DOM from the very first paint on mobile devices.

---

## "On my phone, form fields are tiny, cramped and hard to tap"

Form inputs, buttons and selects were 36px tall with 14px text — too small for comfortable touch interaction on smartphones. The parchment-colored card panels around form sections wasted horizontal space, making fields even narrower.

**Implementation:** All form controls (Input, Button, Select, DatePicker, native `<select>`) now use `h-11 md:h-9` (44px mobile / 36px desktop) and `text-base md:text-sm` (16px / 14px). The 16px font size also prevents iOS Safari from auto-zooming on focus. Card panels are transparent and borderless on mobile (`rounded-none border-0 bg-transparent`), restoring full card styling only on desktop (`md:rounded-xl md:bg-parchment md:border`). Multi-column form rows stack vertically on mobile (`flex-col md:flex-row`). Page wrapper padding reduced from `px-6` to `px-4` on mobile.

---

## "The page zooms in when I tap an input field on my iPhone"

iOS Safari auto-zooms the page when the user focuses a text input with font-size below 16px, then doesn't zoom back out — breaking the layout until a manual pinch-to-zoom.

**Implementation:** Viewport meta tag set to `maximum-scale=1, user-scalable=false` via Next.js `viewport` export in `app/layout.tsx`. All form inputs use `text-base` (16px) on mobile — the threshold below which Safari triggers auto-zoom.

---

## "The app doesn't use the full screen on my phone — there's a gap at the bottom"

The app layout used `h-screen` (100vh), which on mobile Safari equals the maximum viewport height (address bar hidden). When the address bar is visible, the page extends beyond the visible area, causing a scroll gap at the bottom.

**Implementation:** Replaced `h-screen` with `h-dvh` (dynamic viewport height) on `<html>`, `<body>`, and `SidebarProvider`. `dvh` adjusts in real time as the mobile browser UI appears/disappears, ensuring the app always fills exactly the visible area.

---

## "I want to group all my finds of the same type together — like all Roman coins or all Lüneburger Salzplomben"

Finds of the same typological category can be scattered across many individual find records with no way to connect them conceptually. Pairwise linking would require N×(N-1)/2 links and doesn't scale.

**Implementation:** `Collection` model — named, curator-owned groups with a many-to-many relation to `Finding` (`CollectionFindings`). Any logged-in user can add COMPLETED findings to their own collections from the finding detail page via the „Sammlung" dropdown (supports search + inline creation). Collections are listed at `/collections` with cover image and find count; individual collections at `/collections/[id]` show the full findings list. The sidebar dynamically lists the user's own collections as nav items under „Sammlungen".

---

## "The exact location of my find must not be publicly visible, but the report still needs to show roughly where it was found"

German archaeology authorities and community members need geographic context (region, county, municipality) without exposing the precise GPS coordinates, which could lead to illegal excavation at the site.

**Implementation:** `Finding` model stores `adminCountry`, `adminFederalState`, `adminCounty`, `adminMunicipality` (all nullable strings). On every create/update, `lookupAdminUnits()` (`lib/geo.ts`) queries the PostGIS admin unit tables via `ST_Intersects` and writes the resolved names. When `locationPublic === false`, `FindingDetail` shows the municipality boundary polygon on a Leaflet map (`AdminUnitMap`) plus a "Gemeinde · Landkreis · Bundesland" text label instead of exact coordinates. Coordinates outside Germany result in all-null fields (shown as absent). Future: support non-German administrative units.

---

## "Archaeological reports require coordinates in a specific coordinate system (e.g. ETRS89/UTM33 for Saxony), not decimal GPS coordinates"

Each German state archaeology authority requires coordinates in their preferred coordinate system for official reports. GPS coordinates (WGS84 decimal degrees) are not accepted as-is.

**Implementation:** `lib/coordinates.ts` — pure-JS Transverse Mercator projection (no external dependency); `FindingLocationDialog` — CRS dropdown (WGS84 / UTM32 / UTM33) updates the displayed coordinates on demand. Future: auto-select based on `Bundesland`, include transformed coordinates in CSV/report export.

---

## "I found an archaeological object but don't know how to legally register it"

Detectors in Germany are legally required to report finds to their state archaeology authority (Landesdenkmalamt). The process is opaque and varies by state. Sondlr provides a guided "Fund Melden" workflow on each find's detail page that will walk users through registering with the correct authority and selecting which information to share.

**Implementation:** `FindingDetail` → "Fund Melden" button (status: not reported) → PATCH `/api/findings/[id]` sets `reported: true`. Future: modal workflow with authority lookup and pre-filled form.

---

## "I want to document my finds but keep them private until I'm ready"

Detectors want to photograph, describe and categorise a find before making it visible to the community. Publishing should be a deliberate, explicit action.

**Implementation:** `Finding.status` field: `DRAFT` (private) | `COMPLETED` (public). "Fund Veröffentlichen" button on detail page moves DRAFT → COMPLETED. The edit form saves as DRAFT by default. PATCH `/api/findings/[id]` with ownership check.

---

## "I found multiple pieces of the same object — how do I show they belong together?"

Metal detector finds are sometimes fragments of a single object (e.g. a broken fibula, sword fragments, a hoard dispersed across a small area). Without a way to link them, the connection is invisible to other users and authorities reviewing the finds.

**Implementation:** `Finding` model has a symmetric many-to-many self-relation (`relatedTo` / `relatedFrom`) backed by the `_RelatedFindings` junction table. Linking is managed via `POST /DELETE /api/findings/[id]/related` (owner-only). `FindingDetail` shows a "Verwandte Funde" section with compact cards and a live-search picker for adding new links. Both sides of the relation are merged client-side so the link is visible regardless of who initiated it.

---

## "I can't tell whose find I'm looking at or who commented"

Community pages and find cards showed only a single initial as avatar fallback, making it hard to identify users when profile images weren't set.

**Implementation:** `lib/initials.ts` — `getInitials(name)` produces two-letter initials (first letter of first and last word) or one letter for single-word names. Applied to all `AvatarFallback` components across the app.

---

## "Other users are editing my finds"

No ownership enforcement at the UI or page level meant any authenticated user could navigate to `/dashboard/findings/[id]/edit`.

**Implementation:** Server-side ownership check in `app/dashboard/findings/[id]/edit/page.tsx` via `getServerSession` — non-owners receive 404. Client-side: `FindingCard` hides edit button for non-owners using `useSession()`. API PUT route already enforced ownership.

---

## "I want to quickly mark a find as active or reported without going into the edit form"

Toggling publish status or reported flag required opening the full edit form, which is heavyweight for a two-state change.

**Implementation:** Inline toggle buttons in the meta row of `FindingDetail`. Owners click "Aktiv/Entwurf" or "Gemeldet/Nicht gemeldet" directly. PATCH endpoint (`app/api/findings/[id]/route.ts`) handles partial updates with Zod validation and ownership check.

---

## "The demo/seed data has no images, making the UI look empty"

During development and onboarding, all find cards were imageless, making the layout and image-related UI impossible to evaluate.

**Implementation:** `prisma/seed.ts` creates one `Image` record per seeded finding, cycling through Cloudinary's built-in `cld-sample` through `cld-sample-5` assets, and sets `thumbnailId` on each finding.

---

## "Notifications disappear behind the sidebar / get clipped"

Toast notifications positioned `top-right` were rendered inside the `SidebarInset` scroll container and occasionally clipped or overlapping the viewport edge.

**Implementation:** Sonner `Toaster` configured with `offset={{ top: 16, right: 4, bottom: 16, left: 16 }}` to maintain a consistent 4px gap from the right viewport edge at all times.
