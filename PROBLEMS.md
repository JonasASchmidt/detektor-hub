# Problems & Solutions

User problems this codebase solves, mapped to their implementations.

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
