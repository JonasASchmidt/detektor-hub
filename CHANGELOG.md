# Changelog

All notable changes to Sondlr are documented here.
Format: `[Date] — Branch — Description`

---

## [2026-03-20] — `feature/official-roles` (continued)

### Role Management (CRUD)
- **`GET/POST /api/official-roles`** — list roles (ADMIN: all; OFFICIAL: own) and create; requires `MANAGE_ROLES` capability or `ADMIN`
- **`GET/PUT/DELETE /api/official-roles/[id]`** — fetch, full-update (scopes replaced atomically), delete; edit/delete restricted to creator or `ADMIN`
- **`/management/roles`** — list page; shows name, badge preview, scope chips, capability count, member count; Edit/Delete buttons if permitted
- **`/management/roles/new`** — create form; guards against missing `MANAGE_ROLES`
- **`/management/roles/[id]/edit`** — edit form; guards against non-owner/non-admin access
- **`RoleForm`** (`_components/RoleForm.tsx`) — react-hook-form + zod; fields: name, description, priority, badge (label + color with live preview), capability checkboxes (German labels), dynamic scope builder (Bundesland dropdown with all 16 states; Landkreis/Gemeinde free-text)
- **`RolesList`** (`_components/RolesList.tsx`) — client list with inline delete confirmation via AlertDialog
- **`schemas/official-role.ts`** — Zod schema, `CAPABILITY_LABELS`, `ADMIN_UNIT_TYPE_LABELS`
- **`lib/constants/adminUnits.ts`** — `GERMAN_FEDERAL_STATES` const (16 Bundesländer)

### Management Navigation & Dashboard

- **`NavManagement`** (`components/layout/NavManagement.tsx`) — sidebar section with "Verwaltung" group label and links to Übersicht, Benutzer, Rollen; rendered below the main nav with a visual separator
- **`AppSidebar`** — conditionally renders `NavManagement` for users with role `OFFICIAL` or `ADMIN`
- **`/management`** — dashboard overview page with role-aware heading and quick-access cards to sub-sections; guards against non-official access (redirects to `/findings`)
- **`/management/users`** — placeholder page for user management
- **`/management/roles`** — placeholder page for role management
- All management pages use server-side `getServerSession` access guard

### Schema

- **`UserProfile`** — separates PII (firstName, lastName, street, city, zipcode, birthdate) from the `User` model; all fields field-encrypted via `prisma-field-encryption`; one-to-one with `User`, cascades on delete
- **`OfficialRole`** — named role with `capabilities: String[]`, `badgeLabel`, `badgeColor`, `priority` (higher = shown as primary badge), and `createdByUserId`
- **`OfficialRoleScope`** — polymorphic scope binding for `OfficialRole`; each role can cover multiple `FEDERAL_STATE | COUNTY | MUNICIPALITY | ZONE` units; ZONE entries reference a user-created `Zone` for PostGIS containment checks
- **`UserOfficialRole`** — many-to-many between `User` and `OfficialRole`; includes `assignedByUserId`, `assignedAt`, `expiresAt` for audit trail; unique constraint on `(userId, officialRoleId)`
- **`AdminUnitType` enum** — `FEDERAL_STATE | COUNTY | MUNICIPALITY | ZONE`
- `User` updated with `profile`, `officialRoles`, `rolesAssigned`, `rolesCreated` relations
- `Zone` updated with `roleScopes` relation

### Capabilities

- **`lib/capabilities.ts`** — exhaustive `CAPABILITIES` const array and `Capability` type; includes `MANAGE_ROLES`, `MANAGE_USERS`, `VIEW_USER_DATA`, `GRANT_PERMISSION`, `ASSIGN_ZONES`, `MODERATE_COMMUNITY`, `VIEW_ALL_FINDINGS`, `VIEW_FINDING_LOCATIONS`

### Utilities

- **`lib/hasCapability.ts`** — `hasCapability(userId, capability, context?)` helper; resolves active role assignments, checks named admin unit scopes (with inheritance), and runs PostGIS `ST_Contains` for zone-scoped roles; also exports `getPrimaryRole(userId)` for badge rendering
- **`lib/prisma.ts`** — extended with `fieldEncryptionExtension()` from `prisma-field-encryption`; PrismaClient type updated to reflect extended client

### Types

- **`types/roles.ts`** — `AdminUnitType`, `OfficialRole`, `OfficialRoleScope`, `RoleBadge`, `PrimaryRole`

### Docs

- `CLAUDE.md` updated with Role & Capability System conventions

---

## [2026-03-19] — `feature/collections`

### Features

- **Sammlungen** — neues `Collection`-Modell (Name, Beschreibung, Kurator, many-to-many zu `Finding`); ermöglicht typologische Gruppierungen von Funden unabhängig vom Eigentümer
- **`GET/POST /api/collections`** — alle Sammlungen abrufen (optional gefiltert nach `?userId=`) oder neue erstellen
- **`GET/PUT/DELETE /api/collections/[id]`** — Sammlungsdetail, Bearbeiten und Löschen (nur Eigentümer)
- **`POST/DELETE /api/collections/[id]/findings`** — Fund zur Sammlung hinzufügen / entfernen (nur Eigentümer der Sammlung); Ziel-Fund muss COMPLETED oder eigener Fund sein
- **`/collections`** — Übersichtsseite mit eigenen und anderen Sammlungen, getrennt in zwei Sektionen, Cover-Bild aus erstem Fund
- **`/collections/new`** — Formular zum Erstellen einer Sammlung
- **`/collections/[id]`** — Detailseite mit Fundliste (nutzt `FindingCard`); Eigentümer können einzelne Funde per Hover-Button entfernen oder die gesamte Sammlung löschen
- **`/collections/[id]/edit`** — Name und Beschreibung bearbeiten
- **`NavCollections`** (`components/layout/NavCollections.tsx`) — dynamischer Sidebar-Eintrag „Sammlungen" mit aufklappbaren Sub-Items pro Sammlung; lädt Sammlungen des eingeloggten Nutzers per API; zeigt max. 8, danach „Alle anzeigen (N)"; „Neue Sammlung"-Button oben
- **„Sammlung" Button in `FindingDetail`** — öffnet ein Dropdown-Panel mit Checkbox-Liste der eigenen Sammlungen; unterstützt Mehrfach-Zuordnung, Live-Suche und Inline-Erstellung neuer Sammlungen; sichtbar für alle eingeloggten Nutzer bei COMPLETED-Funden

### Schema

- Neues `Collection`-Modell mit impliziter many-to-many Relation zu `Finding` (`CollectionFindings`) und Relation zu `User`

---

## [2026-03-19] — `feature/related-findings`

### Features

- **Verlinkung verwandter Funde** — Funde können miteinander verknüpft werden (z. B. Fragmente eines Gegenstands oder zusammengehörige Objekte); die Verknüpfung ist symmetrisch und für alle sichtbar, kann aber nur vom Eigentümer des Fundes verwaltet werden
- **`POST /DELETE /api/findings/[id]/related`** — verknüpft oder trennt zwei Funde; Eigentümerprüfung; Ziel muss COMPLETED oder eigener Fund sein; verhindert Selbstverlinkung
- **`RelatedFindingsSection` Komponente** (`app/(app)/findings/_components/RelatedFindingsSection.tsx`) — zeigt verknüpfte Funde als kompakte Karten mit Thumbnail, Name, Datum und Finder-Link; Eigentümer können Verknüpfungen per X-Button entfernen und neue über eine Live-Suche hinzufügen; Abschnitt wird bei Nicht-Eigentümern ausgeblendet wenn keine Verknüpfungen vorhanden
- **Live-Suche im Picker** — debounced Suche (300 ms) gegen `GET /api/findings?search=…&status=COMPLETED`; bereits verknüpfte Funde und der Fund selbst werden ausgefiltert
- **GET `/api/findings/[id]`** — gibt jetzt `relatedTo` und `relatedFrom` mit Thumbnail, Name, Datum und User zurück

### Refactors

- **Prisma-Felder in `Finding` auf camelCase umbenannt** — `description_front` → `descriptionFront`, `description_back` → `descriptionBack`, `dating_from` → `datingFrom`, `dating_to` → `datingTo`; DB-Spalten werden per Migration umbenannt (kein `@map` nötig); alle betroffenen API-Routen, Formulare, Komponenten und Schemas aktualisiert
- **Self-Relation-Felder umbenannt** — `Finding_A` / `Finding_B` → `relatedTo` / `relatedFrom` für bessere Lesbarkeit; keine Migration nötig (Prisma-Layer-Umbenennung)
- **Neuer Typ `RelatedFindingSummary`** (`types/RelatedFindingSummary.ts`) — definiert die kompakte Datendarstellung für verknüpfte Funde

---

## [2026-03-19] — `feature/voting`

### Features

- **Vote/Like system** — generic polymorphic `Vote` model (`userId`, `targetType`, `targetId`) covering any entity type; currently used for Findings; unique constraint prevents double-voting
- **`POST /api/votes`** — toggle vote for any entity (`targetType: "FINDING"`, ...); validates finding exists and is COMPLETED; blocks self-voting; returns `{ voted, votesCount }`
- **Vote button on `FindingCard`** — heart icon with count badge shown on community feed for non-owners; optimistic UI with rollback on error; red fill when voted
- **Vote count + `userVoted` in community findings API** — two extra queries per page (groupBy for counts, findMany for user's votes); no N+1
- **"Meiste Votes" sort** in community feed — when `sort=votes`, all matching findings are fetched, sorted by vote count in memory, then paginated; added to sort dropdown
- **`GET /api/community/top-finding?period=week|year`** — returns the COMPLETED finding with the most votes in the last 7 days (week) or since Jan 1 (year); falls back to all-time top if no votes in window; includes `votesCount`, `userVoted`, `isFallback`
- **"Fund der Woche" & "Fund des Jahres"** — featured cards at the top of the community page, fetched client-side on mount; hidden when no votes exist yet; "alle Zeit" label shown on fallback

---

## [2026-03-18] — `feature/data-import`

### Features

- **Import wizard at `/import`** (`app/(app)/import/`) — 3-step wizard (Upload → Vorschau → Fertig) for importing finds and sessions from external sources; accessible via sidebar under "Importieren"
- **GPX import** (`parsers/parseGpx.ts`, `@tmcw/togeojson`) — parses `<trk>` elements into FieldSessions (with PostGIS LineString route) and `<wpt>` elements into Findings; handles both LineString and MultiLineString track geometries; supports GoTerrain, Garmin, and generic GPX exports
- **Geotagged photo import** (`parsers/parseImages.ts`, `exifr`) — extracts GPS coordinates and `DateTimeOriginal` from JPEG/PNG/HEIC/HEIF EXIF data; HEIC converted to JPEG preview via `heic2any` (dynamic import); images without GPS are skipped with count reported
- **Session assignment step** — always prompts whether to create a new session from the GPX track (name editable), attach to an existing session, or import with no session
- **Duplicate detection** — `POST /api/import/findings` checks for existing findings at the exact same lat/lng per user; duplicate indices returned in response and surfaced in the result step
- **`POST /api/import/sessions`** — creates a FieldSession with optional PostGIS route geometry from GeoJSON LineString coordinates (mirrors the existing `PATCH /api/field-sessions/[id]/route` pattern)
- **`POST /api/import/findings`** — batch creates up to 500 findings; runs `lookupAdminUnits()` per finding; connects uploaded Cloudinary image if `imageId` provided; revalidates `/findings` and `/community`

### Dependencies added

- `@tmcw/togeojson` — GPX/KML → GeoJSON conversion
- `exifr` — EXIF GPS + date extraction (supports HEIC natively)
- `heic2any` — in-browser HEIC → JPEG conversion for previews
- `papaparse` — CSV parsing (used in upcoming Phase 2 CSV import)

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
