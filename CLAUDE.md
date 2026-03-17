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

```bash
npm run dev          # Start dev server with Turbopack
npm run build        # prisma generate + next build
npm run lint         # ESLint
npx prisma studio    # Open Prisma Studio GUI
npx prisma migrate dev --name <migration_name>  # Create and apply new migration
npx prisma generate  # Regenerate TypeScript types from schema
npx prisma migrate deploy  # Apply pending migrations to DB
npx prisma db seed   # Run seed (creates demo users, finds, images, comments)
```

**Do not run the dev server from Claude** — user starts it in their terminal to avoid zombie processes.
**Do not run `npm install` from Claude** — let user run it in their terminal (slow in sandbox).

No test runner is configured yet.

---

## Architecture

### Stack
- **Next.js 16** (App Router, TypeScript) with Turbopack in dev
- **Auth**: NextAuth v4 with JWT strategy and credentials provider — auth config in `lib/auth.ts`; session includes `user.id` and `user.role`
- **Database**: PostgreSQL + PostGIS via Prisma ORM — schema in `prisma/schema.prisma`
- **Images**: Cloudinary — utilities in `lib/cloudinary.ts`
- **UI**: shadcn/ui components (in `components/ui/`) + Radix UI primitives, Tailwind CSS, lucide-react icons
- **Maps**: Leaflet + react-leaflet — always lazy-loaded with `dynamic(..., { ssr: false })` due to SSR incompatibility
- **Validation**: Zod schemas in `schemas/` — shared between API routes and forms
- **Notifications (toast)**: Sonner via `components/ui/sonner.tsx`

### Route Structure

```
app/
  layout.tsx              # Root layout — AuthProvider + Leaflet CSS
  (app)/                  # Route group — auth-gated: AppSidebar + AppHeaderBar + Toaster (no URL segment)
    layout.tsx
    findings/             # Main findings area → /findings
      page.tsx            # KPI stats + mini map
      [id]/page.tsx       # Find detail (FindingDetail component)
      [id]/edit/page.tsx  # Edit form — server-side ownership check via getServerSession
      map/                # Full map view
      new/                # Create new finding
    community/            # Public finds feed with comments preview → /community
    tags/                 # Tag and category management → /tags
    images/               # User image library → /images
    zones/                # Permitted search area management → /zones
    sessions/             # Field session management → /sessions
    profile/[userId]/     # User profile page → /profile/[userId]
  api/
    findings/             # GET (filtered list + pagination), POST (create)
      stats/              # Aggregated KPI stats
      [id]/               # GET, PUT (full update), PATCH (status/reported), DELETE
    tags/                 # Tag CRUD
    tag-categories/       # Category CRUD
    images/               # Image upload via Cloudinary
    user-images/          # User-scoped image list
    auth/                 # NextAuth handler
    geo/admin-units/      # Reverse geocoding: coordinates → Bundesland/Landkreis/Gemeinde
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
`app/_hooks/useURLFilters.ts` provides `setFilter`, `setMultipleFilters`, `clearAll`, `get` — always use this for filterable pages. Filter state lives in URL params.

### Reusable filter components
`components/filters/`: `FilterBar`, `SearchFilter`, `SelectFilter`, `MultiSelectFilter`, `TagSelectFilter`, `DateRangeFilter`, `LocationFilter`

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

## Known Issues & Gotchas

- **ChunkLoadError** on dev: clear `.next` dir and hard-refresh browser — `rm -rf .next && npm run dev`
- **SSH push fails from Claude**: user must push manually from terminal
- **`next-themes`** is used by `sonner.tsx` — do NOT remove it
- **Hydration warning** from `cz-shortcut-listen`: browser extension, not code
- **Port conflicts**: user runs multiple projects — `lsof -i:3000 | grep LISTEN`
- **Community API**: NEVER expose `lat`/`lng` position data — strict privacy requirement
- **Prisma migrations**: managed via Supabase MCP in production, not `prisma migrate deploy` in build script
