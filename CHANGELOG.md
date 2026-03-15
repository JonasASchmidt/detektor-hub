# Changelog

All notable changes to Sondlr are documented here.
Format: `[Date] — Branch — Description`

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
