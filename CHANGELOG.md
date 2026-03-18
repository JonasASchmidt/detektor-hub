# Changelog

All notable changes to Sondlr are documented here.
Format: `[Date] — Branch — Description`

---

## [2026-03-18] — `main` (admin units)

### Features

- **Administrative unit lookup on finding create/update** (`lib/geo.ts`, `app/api/findings/route.ts`, `app/api/findings/[id]/route.ts`) — when a finding is saved with coordinates, a PostGIS `ST_Intersects` query resolves the German administrative hierarchy (Gemeinde → Landkreis → Bundesland → Land) and stores it on the finding; re-runs only when coordinates change on update
- **Admin unit polygon map in FindingDetail** (`components/map/AdminUnitMap.tsx`, `app/api/geo/admin-units/polygon/route.ts`) — when the exact location is private, a Leaflet map renders the municipality boundary polygon (falls back to county → federal state); bounds auto-fit to the polygon; non-interactive (no zoom/pan controls)
- **Admin unit text label always visible** (`FindingDetail.tsx`) — Gemeinde · Landkreis · Bundesland shown with a pin icon below whichever map is displayed; gracefully absent for coordinates outside Germany
- **`npm run seed:geo`** (`package.json`, `scripts/create_administrative_units_table.py`) — new npm script runs the Python geo data script; script now reads `POSTGRES_URL_NON_POOLING` from `.env.local` directly instead of 4 separate env vars; requires `uv`
- **Admin unit tables declared in Prisma schema** (`prisma/schema.prisma`) — four `@@ignore` models prevent `prisma db push` from dropping the PostGIS tables managed by the Python script

### Refactors

- **`lib/geo.ts`** — `lookupAdminUnits` helper extracted from `app/api/geo/admin-units/route.ts`; geo API route now delegates to the shared helper
- **`scripts/create_administrative_units_table.py`** — removed unused `psycopg` import; repeated transform blocks extracted into `load_layer()` and `write_layer()` helpers

---

## [2026-03-18] — `field-session-improvements`

### Features

- **Client-side image resize before upload** (`lib/resizeImage.ts`, `QuickFindForm.tsx`) — images are resized to max 1920px on the long edge and re-encoded as JPEG at 82% quality before upload; significantly reduces upload time on mobile and Cloudinary storage costs; original files already within bounds are passed through unchanged
- **GPS route tracking: distance filter** (`useRouteTracker.ts`) — new points are only recorded when the user has moved ≥ 10 m from the last accepted point (Haversine formula); readings with accuracy worse than 30 m are discarded; eliminates duplicate points when standing still
- **GPS route tracking: single server write** (`useRouteTracker.ts`) — removed periodic 30-second sync interval; route is now written to the database only once when tracking is stopped, reducing DB writes to zero during a session
- **Continue route tracking** (`useRouteTracker.ts`) — when tracking is started for a session that already has a stored route, the existing coordinates are loaded from the server and merged with new points on stop; old route data is preserved across multiple tracking sessions
- **Screen Wake Lock during tracking** (`useRouteTracker.ts`, `ActiveSessionBar.tsx`) — requests `navigator.wakeLock` when tracking starts to prevent the browser from being suspended when the screen dims on mobile; automatically re-acquires the lock when the tab regains visibility; a phone icon in the session bar indicates whether the lock is active
- **Swipeable / dismissable toasts** (`components/ui/sonner.tsx`) — added `closeButton` prop to the global Sonner toaster; all toasts now show an X button and can be swiped away on mobile

### Bug Fixes

- **Field view overflow on small screens** (`app/field/layout.tsx`) — changed outer container from `min-h-dvh` to `h-dvh overflow-hidden`; the find form now scrolls within the fixed viewport height so the submit button is always reachable

---

## [2026-03-17] — `coordinate-transformation`

### Features

- **Coordinate system selector in location dialog** (`FindingLocationDialog`) — users can switch between WGS84 (GPS), ETRS89/UTM Zone 32N, and ETRS89/UTM Zone 33N (required by Saxony and other eastern German state archaeology authorities)
- **`lib/coordinates.ts`** — pure-JS WGS84 → UTM Transverse Mercator projection; exports `wgs84ToUTM`, `formatUTM`, `formatCoordinates`, `COORDINATE_SYSTEM_LABELS`

---

## [2026-03-15] — `ui-improvements` (session 7)

### Bug Fixes

- **Removed React DevTools script** (`app/layout.tsx`) — `<Script src="http://localhost:8097">` was unconditionally loaded in dev, causing `ERR_CONNECTION_REFUSED` in the console whenever React DevTools standalone wasn't running
- **Fixed `SearchFilter` mount-time navigation** (`components/filters/SearchFilter.tsx`) — added `mounted` ref so `onChange` effect skips the initial render; previously it called `router.replace()` on every page load, triggering a navigation that tried to fetch stale Turbopack chunk hashes (404 cascade after Fast Refresh)

---

## [2026-03-15] — `ui-improvements`

### Security

- **Edit-page ownership guard** (`app/dashboard/findings/[id]/edit/page.tsx`) — server-side `getServerSession` check; non-owners receive 404 (no existence leak)
- **Edit button visibility** (`FindingCard`) — `useSession()` compares `session.user.id` to `finding.userId`; button only renders for the owner
- **PATCH endpoint** (`app/api/findings/[id]/route.ts`) — new handler with Zod validation + ownership check for toggling `status` and `reported` fields

### Features

- **Status & Reported toggles on find detail page** — owners can click Aktiv/Entwurf and Gemeldet/Nicht gemeldet inline in the meta row; PATCH call updates DB; non-owners see read-only labels
- **"Fund Veröffentlichen" button** — shown on detail page when status is DRAFT; publishes the find (DRAFT → COMPLETED) via existing PATCH endpoint
- **"Fund Melden" button** — shown on detail page when find is not yet reported; sets `reported: true`; placeholder for future Melde-workflow modal
- **"Fund Bearbeiten" button** — moved to action row directly below headline (above meta row), alongside back button and new action buttons
- **Initials avatar fallbacks** — new shared `lib/initials.ts` utility: 2-letter initials (first + last name) or 1 letter for single-word names; applied across all avatar fallbacks (FindingCard, FindingDetail, community page, profile page, NavUser)
- **Seed images** — `prisma/seed.ts` now creates one Cloudinary `Image` record per finding (using `cld-sample` through `cld-sample-5` cycling) and sets `thumbnailId` on each finding

### UI / Polish

- **Meta row dots removed** — separator dots (● / ·) removed from find card and detail page meta rows; replaced with `gap-3` spacing
- **Year shortened to YY** — date format changed from `yyyy` to `yy` in FindingCard and FindingDetail meta rows
- **Tag horizontal padding reduced by 4px** — `Tag.tsx` `px-3 → px-2`; inline card tags `px-2 → px-1`
- **Back button redesign** — square (`h-8 w-8`), same ghost border style as "Fund Bearbeiten"; ChevronLeft icon fills the button
- **Notification bell icon** — filled icon on hover and active state (Tailwind arbitrary `[fill:currentColor] [stroke-width:0]`); background shape removed
- **Comment sort control** — replaced toggle button with `SelectFilter` (same dropdown component as findings list sort)
- **Toaster offset** — 4px right gap from viewport edge; top/bottom/left retain 16px default
- **Headline line-height** — 130% (`leading-[1.3]`) on find detail page `h1`
- **Notification bell active state** — filled bell icon replaces background highlight

### Bug Fixes

- **ChunkLoadError** — stale Turbopack chunk; resolved by clearing `.next` cache (documented in known issues)
- **Seed cleanup order** — images deleted before findings to avoid FK constraint errors during re-seed
- **Jonas findings delete** — added missing `await prisma.finding.deleteMany({ where: { userId: jonasUser.id } })` before re-seeding Jonas's finds

---

## Earlier sessions (reconstructed from git log)

### [2026-03-09] — `ui-improvements`

- Next.js 15 → 16.1.6, React 19.2.4
- Image detail lightbox with prev/next navigation
- Mobile burger menu (fullscreen Sheet drawer)
- AppHeaderBar moved inside SidebarProvider
- Image metadata fields (filename, size, width, height) added to schema
- Anthracite foreground color, 130% body line-height
- Fixed react-hook-form dependency
- Removed `prisma migrate deploy` from build script

### [~2026-02] — `implement-zones`

- Zone model + PostGIS geometry field
- Zone form, map drawing, zone list
- Field sessions linked to zones
- Seed data for zones and field sessions
