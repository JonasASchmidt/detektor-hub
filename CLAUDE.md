# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Sondlr (Detektorhub) is a web platform for legal registration of archaeological metal detector finds in Germany. It connects volunteer detectorists ("Sondler*innen") with state archaeology authorities. The UI and domain language is **German**.

---

## Mandatory Workflow Rules

These apply to every session, every change, no exceptions:

1. **Always work on a branch** — never commit directly to `main`. Create a feature branch, push it, open a PR with a description.
2. **Update CHANGELOG.md** after every session — add a dated section under the current branch name summarising all changes made.
3. **Update README.md** when the app concept, feature set, stack or setup steps change.
4. **Update PROBLEMS.md** when a new user problem is solved — document it as the user problem first, implementation second.
5. **Update CLAUDE.md** when new patterns, conventions or architectural decisions are established.
6. **Comment and annotate code** — add inline comments for non-obvious logic, especially in API routes, hooks and complex components.
7. **Work structuredly** — break larger tasks into steps, confirm approach before touching code when scope is unclear.

---

## Commands

Run from the **monorepo root** (`d:\DetektorHub\detektor-hub`):

```bash
pnpm dev             # Start web dev server with Turbopack (delegates to apps/web)
pnpm build           # Build web app (delegates to apps/web)
pnpm lint            # Lint web app (delegates to apps/web)
```

Run from **`apps/web/`** for Prisma and other web-specific commands:

```bash
npx prisma studio    # Open Prisma Studio GUI
npx prisma migrate dev --name <migration_name>  # Create and apply new migration
npx prisma generate  # Regenerate TypeScript types from schema
npx prisma migrate deploy  # Apply pending migrations to DB
npx prisma db seed   # Run seed (creates demo users, finds, images, comments)
```

**Do not run the dev server from Claude** — user starts it in their terminal to avoid zombie processes.
**Do not run `pnpm install` from Claude** — let user run it in their terminal (slow in sandbox).

No test runner is configured yet.

---

## Architecture

### Monorepo Structure

This is a **pnpm workspace monorepo**. Package manager: `pnpm`. Do not use `npm` for installs.

```
detektor-hub/            # workspace root
  apps/
    web/                 # Next.js 16 web app
    mobile/              # Expo SDK 54 React Native app (iOS + Android)
  packages/
    shared/              # Shared Zod schemas and TypeScript types (used by both apps)
  pnpm-workspace.yaml
  package.json           # workspace root — scripts delegate to apps/web
```

All paths in this document under `lib/`, `components/`, `app/`, etc. are relative to `apps/web/` unless stated otherwise. Paths under `apps/mobile/` are explicitly prefixed.

### Web Stack
- **Next.js 16** (App Router, TypeScript) with Turbopack in dev — lives in `apps/web/`
- **Auth**: NextAuth v4 with JWT strategy and credentials provider — auth config in `lib/auth.ts`; session includes `user.id` and `user.role`
- **Database**: PostgreSQL + PostGIS via Prisma ORM — schema in `prisma/schema.prisma`
- **Images**: Cloudinary — utilities in `lib/cloudinary.ts`
- **UI**: shadcn/ui components (in `components/ui/`) + Radix UI primitives, Tailwind CSS, lucide-react icons
- **Maps**: Leaflet + react-leaflet — always lazy-loaded with `dynamic(..., { ssr: false })` due to SSR incompatibility
- **Validation**: Zod schemas in `schemas/` (web-only) and `packages/shared/src/` (shared with mobile)
- **Notifications (toast)**: Sonner via `components/ui/sonner.tsx`

### Mobile Stack (`apps/mobile/`)
- **Expo SDK 54** with Expo Router v6 (file-based routing, same mental model as Next.js App Router)
- **Auth**: Bearer JWT tokens — `POST /api/mobile/login` returns a NextAuth-compatible token stored in `expo-secure-store`; all mobile API routes use `getMobileSession(req)` in `apps/web/lib/mobile-auth.ts`
- **Offline-first**: all field writes go to local SQLite (`expo-sqlite`) via `lib/db.ts`; images cached to device filesystem (`expo-file-system`); sync to server happens in one batch at session end via `lib/sync.ts`
- **Connectivity**: `@react-native-community/netinfo` via `hooks/useNetInfo.ts` — gates sync and shows offline badge
- **GPS**: `expo-location` foreground tracking in `hooks/useLocationTracker.ts`; background tracking requires a dev build (not available in Expo Go)
- **Camera**: `expo-image-picker` — images are copied from temp camera URI to permanent app storage immediately after capture
- **Navigation**: Expo Router tabs — `(app)/sessions` and `(app)/session/new` + `(app)/session/[id]`

### Route Structure

```
app/
  layout.tsx              # Root layout — AuthProvider + Leaflet CSS
  page.tsx                # Redirects to /findings
  login/                  # Login page
  signup/                 # Registration page
  field/                  # Field mode (quick-capture, GPS tracking) → /field
  (app)/                  # Route group — auth-gated: AppSidebar + AppHeaderBar + Toaster (no URL segment)
    layout.tsx            # Auth guard + sidebar layout; redirects to /login if unauthenticated
    findings/             # → /findings
      page.tsx            # KPI stats + mini map
      _components/        # FindingCard, FindingDetail, FindingMap, FindingsForm, FindingsClient, …
      new/                # → /findings/new
        _components/      # FindingsPage (client wrapper)
      [id]/               # → /findings/:id
        edit/             # → /findings/:id/edit
    community/            # Public finds feed with comments preview → /community
    tags/                 # Tag management → /tags
      categories/         # Tag category management → /tags/categories
    images/               # User image library → /images
    zones/                # Permitted search areas → /zones
      new/                # → /zones/new
      [id]/               # → /zones/:id
    sessions/             # Field sessions → /sessions
      new/                # → /sessions/new
      [id]/               # → /sessions/:id
        edit/             # → /sessions/:id/edit
    profile/[userId]/     # User profile → /profile/:userId
  api/
    findings/             # GET (filtered list + pagination), POST (create)
      stats/              # Aggregated KPI stats
      draft/              # POST — save draft
      [id]/               # GET, PUT (full update), PATCH (status/reported), DELETE
        comments/         # POST comment
    tags/                 # Tag CRUD
    tag-categories/       # Category CRUD
    images/               # Image upload via Cloudinary; [id]/ for GET/DELETE; bulk/ for bulk ops
    user-images/          # User-scoped image list
    field-sessions/       # Field session CRUD; [id]/route/ for GPS track PATCH/DELETE
    zones/                # Zone CRUD
    active-session/       # Cookie-backed active session read/write
    notifications/        # Notification list + read-all
    community/findings/   # Public findings feed (no location data)
    detectors/            # Detector list
    user/                 # User profile update
    auth/                 # NextAuth handler + register
    geo/admin-units/      # Reverse geocoding: coordinates → Bundesland/Landkreis/Gemeinde
    mobile/
      login/             # POST — verifies credentials, returns NextAuth-compatible Bearer JWT
      sessions/          # GET (list, ?open=true filter), POST (create)
        [id]/            # PATCH (update dateTo / close session)
          route/         # PATCH (save GPS route as GeoJSON LineString)
      findings/
        draft/           # POST — create DRAFT finding (used by mobile sync engine)
      images/            # POST — multipart upload to Cloudinary, returns image record
```

### Key Data Models (Prisma)

- **Finding** — core entity: lat/lng, status (`DRAFT` | `COMPLETED`), `reported` flag, dating range, physical measurements, related findings (self-relation)
- **Tag** / **TagCategory** — hierarchical categorisation with color and icon
- **Image** — Cloudinary-backed; `publicId` is the Cloudinary asset ID; `thumbnailId` on Finding points to preferred image
- **Comment** — community identification comments on findings
- **Notification** — `FINDING_COMMENT` | `MENTION` | `REPLY`; `Notification` model exists, UI panel exists, email delivery not yet implemented
- **Zone** — PostGIS polygon; permitted search areas per user
- **FieldSession** — dated session linked to zone and detector
- **Detector** — metal detector model reference
- **User** — credentials auth with `role` field (default "USER")

---

## Patterns & Conventions

### Ownership & Security
- All API routes use `getServerSession(authOptions)` for auth checks
- For mutations (PUT, PATCH, DELETE): always fetch the record first, verify `userId === session.user.id`, return 404 (not 403) to avoid leaking existence
- Edit pages: add `getServerSession` + ownership check at the server component level — redirect to `notFound()` for non-owners
- Never expose `latitude`/`longitude` on community/public API responses unless `locationPublic === true`

### PATCH vs PUT
- `PUT /api/findings/[id]` — full finding update via `findingSchemaCompleted` (from the edit form)
- `PATCH /api/findings/[id]` — partial update for `status` and `reported` fields only; Zod schema inline

### Filter persistence
`hooks/useURLFilters.ts` provides `setFilter`, `setMultipleFilters`, `clearAll`, `get` — always use this for filterable pages. Filter state lives in URL params.

### Reusable filter components
`components/filters/`: `FilterBar`, `SearchFilter`, `SelectFilter`, `MultiSelectFilter`, `TagSelectFilter`, `DateRangeFilter`, `LocationFilter`

### Hooks
All custom hooks live in `hooks/` (root level, alongside `components/` and `lib/`) and use camelCase naming (`useXxx.ts`).

### Types
All custom TypeScript types live in `types/` (root). No `.type.ts` double-extension — plain `.ts`.

### Layout components
`components/layout/`: `AppSidebar`, `AppHeaderBar`, `NavMain`, `NavUser`, `SessionProvider`, `Breadcrumbs`, `PageTitle`, `TeamSwitcher`.

### Image components
`components/images/`: the single source of truth for all image-related UI — `ImageGallery`, `ImageCard`, `ImageDetailDialog`, `ImageDeleteDialog`, `ImageEditor`.

### Map components
`components/map/`: all Leaflet map components use **PascalCase** filenames (`ClickHandler.tsx`, `SessionMap.tsx`, `SimpleMap.tsx`, `ZonePickerMap.tsx`). Always lazy-loaded via `dynamic(() => import('...'), { ssr: false })`.

### Route-local components
Non-route files inside a route folder must live in `_components/`. `page.tsx`, `layout.tsx`, and `loading.tsx` are the only files allowed at the root of a route folder.

### Initials utility
`lib/initials.ts` — `getInitials(name)`: 2-letter initials (first + last word) or 1 letter. Use for all `AvatarFallback` components.

### Map loading
Leaflet must always be loaded with `dynamic(() => import('...'), { ssr: false })`.

### Path aliases
`@/` maps to the project root (configured in `tsconfig.json`).

---

## Visual Conventions

- Active sidebar item: `bg-zinc-300`
- App header background: `#2d2d2d` (matches `--primary` CSS var)
- Content panels: `rounded-xl` (12px); menu items: `rounded-md` (6px)
- App header height: 48px (`h-12`), 12px left padding (`pl-3`)
- Foreground: anthracite `--foreground: 0 0% 17.6%`
- Body line-height: 130% (set in `globals.css`)
- Ghost action buttons (Bearbeiten, Veröffentlichen, Melden): `h-8 border-2 border-foreground hover:bg-[#2d2d2d] hover:text-white hover:border-[#2d2d2d]`

---

## Environment Variables

Required in `.env.local`:
- `POSTGRES_PRISMA_URL` — pooled connection string
- `POSTGRES_URL_NON_POOLING` — direct connection (for migrations)
- `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

---

## Mobile Patterns & Conventions

### Offline-first field capture
All session, find, and image writes from `FieldMode` go to SQLite first — never directly to the server during a session. Sync happens once at session end via `syncLocalSession()` (for sessions created offline) or `syncOrphanFinds()` (for finds added to an already-synced server session). This means:
- No network dependency during capture — works in dead zones
- One batch of API calls instead of many small ones
- Data is safe even if the app crashes mid-session (buffer persists in SQLite)

### SQLite singleton (`apps/mobile/lib/db.ts`)
Use a Promise-based singleton — not a plain variable singleton — to avoid the Android `NativeDatabase NullPointerException`. Concurrent `getDb()` calls from multiple components must all await the same `initDb()` Promise:
```ts
let _dbPromise: Promise<SQLiteDatabase> | null = null;
function getDb() {
  if (!_dbPromise) _dbPromise = initDb().catch(err => { _dbPromise = null; throw err; });
  return _dbPromise;
}
```

### Session ID convention
- Sessions created offline have IDs prefixed `local_` (e.g. `local_abc123`) until synced
- After sync, `server_id` is written to SQLite; the local ID remains the primary key
- `saveSessionServerId()` must be called immediately after `POST /api/mobile/sessions` succeeds — before uploading finds — to prevent duplicate sessions if sync crashes mid-way

### Mobile image upload
Use the `{ uri, name, type }` FormData object — **not** `fetch(uri).blob()`. React Native's FormData implementation handles `{ uri, name, type }` natively for `file://` URIs. The blob approach silently fails on Android:
```ts
formData.append("file", { uri: localPath, name: "photo.jpg", type: "image/jpeg" } as unknown as Blob);
```

### Installing packages in `apps/mobile`
**Never use `npx expo install`** — it falls back to npm which cannot resolve pnpm's `workspace:*` protocol. Use pnpm directly:
```bash
cd apps/mobile && pnpm add <package-name>
```

### Bearer auth for mobile API routes
All routes under `app/api/mobile/` use `getMobileSession(req)` from `lib/mobile-auth.ts` instead of `getServerSession`. The helper decodes the `Authorization: Bearer <token>` header using `next-auth/jwt` `decode` with `NEXTAUTH_SECRET`.

---

## Known Issues & Gotchas

- **ChunkLoadError** on dev: clear `.next` dir and hard-refresh browser — `rm -rf .next && npm run dev`
- **SSH push fails from Claude**: user must push manually from terminal
- **`next-themes`** is used by `sonner.tsx` — do NOT remove it
- **Hydration warning** from `cz-shortcut-listen`: browser extension, not code
- **Port conflicts**: user runs multiple projects — `lsof -i:3000 | grep LISTEN`
- **Community API**: NEVER expose `lat`/`lng` position data — strict privacy requirement
- **Prisma migrations**: managed via Supabase MCP in production, not `prisma migrate deploy` in build script
