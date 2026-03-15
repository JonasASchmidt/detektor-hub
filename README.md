# Sondlr

A web platform for legal registration of archaeological metal detector finds in Germany. Connects volunteer detectorists ("Sondler*innen") with state archaeology authorities (Landesdenkmalämter).

**UI and domain language: German.**

---

## What It Does

- Detectors document finds with photos, location, dating, measurements and tags
- Finds have a two-step lifecycle: **Entwurf** (draft, private) → **Aktiv** (published, community-visible)
- Community members identify and comment on published finds
- Detectors report finds to their state authority via a guided **Melde-workflow** (in development)
- Zones (permitted search areas) and field sessions are tracked per user

---

## Getting Started

```bash
npm run dev           # Start dev server (Turbopack)
npm run build         # Build for production
npm run lint          # ESLint
npx prisma db seed    # Seed demo data (2 users, ~26 finds with images, tags, comments)
npx prisma studio     # Open Prisma GUI
```

Default seed accounts:
- `demo@detektorhub.de` / `password123` (Max Sondler)
- `jonas.a.schmidt@gmail.com` / `password123` (JonasASchmidt)

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript, Turbopack) |
| Auth | NextAuth v4, JWT, credentials provider |
| Database | PostgreSQL + PostGIS via Prisma ORM |
| Images | Cloudinary |
| UI | shadcn/ui, Radix UI, Tailwind CSS, lucide-react |
| Maps | Leaflet + react-leaflet (SSR-disabled via `dynamic`) |
| Validation | Zod (shared between API routes and forms) |
| Notifications | Sonner (toast) |

---

## Environment Variables

Required in `.env.local`:

```
POSTGRES_PRISMA_URL=          # Pooled connection
POSTGRES_URL_NON_POOLING=     # Direct connection (migrations)
NEXTAUTH_SECRET=
NEXTAUTH_URL=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

---

## Key Commands

```bash
npx prisma migrate dev --name <name>   # Create + apply new migration
npx prisma generate                    # Regenerate TS types from schema
npx prisma migrate deploy              # Apply pending migrations (CI/prod)
```

---

## Concept & Roadmap

See `PROBLEMS.md` for user problems this codebase solves.
See `CHANGELOG.md` for a history of changes.

### Planned features
- **Melde-workflow modal** — guided find registration with authority lookup, pre-filled form, and preset selection
- **Email notifications** — notify find owners when a comment is posted on their find
- **In-app notifications** — `Notification` model exists in schema; UI panel exists (`NotificationCenter`); backend delivery not yet wired
- **Map markers by tag color** — location pin icon colored by primary tag
- **Filter chips** — date range, location, tags as removable chips
