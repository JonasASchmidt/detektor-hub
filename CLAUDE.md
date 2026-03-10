# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Detektorhub is a web platform for legal registration of archaeological metal detector finds in Germany. It connects volunteer detectorists ("Sondler*innen") with state archaeology authorities. The UI and domain language is **German**.

## Commands

```bash
npm run dev          # Start dev server with Turbopack
npm run build        # prisma generate + migrate deploy + next build
npm run lint         # ESLint
npx prisma studio    # Open Prisma Studio GUI
npx prisma migrate dev --name <migration_name>  # Create and apply new migration
npx prisma generate  # Regenerate TypeScript types from schema
npx prisma migrate deploy  # Apply pending migrations to DB
```

No test runner is configured yet.

## Architecture

### Stack
- **Next.js 15** (App Router, TypeScript) with Turbopack in dev
- **Auth**: NextAuth v4 with JWT strategy and credentials provider — auth config in `lib/auth.ts`; session includes `user.id` and `user.role`
- **Database**: PostgreSQL + PostGIS via Prisma ORM — schema in `prisma/schema.prisma`
- **Images**: Cloudinary — utilities in `lib/cloudinary.ts`
- **UI**: shadcn/ui components (in `components/ui/`) + Radix UI primitives, Tailwind CSS, lucide-react icons
- **Maps**: Leaflet + react-leaflet — always lazy-loaded with `dynamic(..., { ssr: false })` due to SSR incompatibility
- **Validation**: Zod schemas in `schemas/` — shared between API routes and forms

### Route Structure

```
app/
  layout.tsx           # Root layout — wraps everything in AuthProvider + Leaflet CSS
  dashboard/
    layout.tsx         # Auth-gated layout with AppSidebar + AppHeaderBar + Toaster
    findings/          # Main findings area
      page.tsx         # Dashboard overview with KPI stats + mini map
      [id]/            # Finding detail / edit
      map/             # Full map view
      new/             # Create new finding
    tags/              # Tag and category management
    images/            # User image library
  api/
    findings/          # GET (filtered list + pagination), POST (create)
      stats/           # Aggregated KPI stats
      [id]/            # GET, PUT, DELETE for single finding
    tags/              # Tag CRUD
    tag-categories/    # Category CRUD
    images/            # Image upload via Cloudinary
    user-images/       # User-scoped image list
    auth/              # NextAuth handler
    geo/admin-units/   # Reverse geocoding: coordinates → Bundesland/Landkreis/Gemeinde
```

### Key Data Models (Prisma)

- **Finding** — core entity: lat/lng, status (DRAFT | COMPLETED), reported flag, dating range, physical measurements, related findings (self-relation)
- **Tag** / **TagCategory** — hierarchical categorization with color and icon
- **Image** — Cloudinary-backed, can be attached to a finding or remain in user gallery
- **Comment** — community identification on findings
- **Detector** — metal detector model reference
- **User** — credentials auth with `role` field (default "USER")

### Patterns

**Filter persistence via URL params** — `app/_hooks/useURLFilters.ts` provides `setFilter`, `setMultipleFilters`, `clearAll`, `get` utilities that sync filter state to the URL using `router.replace`. Always use this hook for filterable list pages.

**Reusable filter components** live in `components/filters/`: `FilterBar`, `SearchFilter`, `SelectFilter`, `TagSelectFilter`, `DateRangeFilter`, `LocationFilter` — compose these for filter UIs.

**API route pattern**: All routes in `app/api/` use `getServerSession(authOptions)` for auth checks. GET routes on findings support query params: `q`, `orderBy`, `order`, `page`, `pageSize`, `tags` (comma-separated IDs), `status`, `dateFrom`, `dateTo`, `reported`, `lat`/`lng`/`radius`.

**Leaflet maps** must always be loaded with `dynamic(() => import('...'), { ssr: false })`.

**Path aliases**: `@/` maps to the project root (configured in `tsconfig.json`).

### Environment Variables

Required in `.env.local`:
- `POSTGRES_PRISMA_URL` — pooled connection string
- `POSTGRES_URL_NON_POOLING` — direct connection (for migrations)
- `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
- `CLOUDINARY_*` — cloud name, API key, API secret
