# Roadmap

## Milestone 1: MVP Stabilization & UI Polish


### Phase 1: Fix bugs and improve UI

**Goal:** Fix all existing bugs (map SSR crash, filter propagation, Cloudinary preset), add a full-width branded header bar with German breadcrumb navigation, restructure sidebar navigation, and build an enhanced Funde dashboard page with stat cards, mini map, and URL-persisted filters.
**Requirements**: TBD
**Depends on:** Phase 0
**Plans:** 3 plans

Plans:
- [x] 01-01-PLAN.md -- Fix bugs (map SSR, filters, Cloudinary) and wire user data into sidebar
- [ ] 01-02-PLAN.md -- Create app header bar and restructure sidebar navigation
- [ ] 01-03-PLAN.md -- Build enhanced Funde page with dashboard stats, filters, and mini map

### Phase 1.1: Security Hardening

**Goal:** Close all authentication/authorization gaps: add auth guards to tag and category mutation routes, fix image delete to verify ownership, add missing PUT/DELETE handlers for findings with ownership checks, cap pagination pageSize to prevent DoS, fix inconsistent getServerSession usage, and remove debug code.
**Requirements**: See `docs/superpowers/plans/2026-03-11-security-hardening.md`
**Depends on:** Phase 1
**Plans:** 3 plans

Plans:
- [ ] 01.1-01-PLAN.md -- Auth guards on tag/category routes + fix getServerSession in bulk route
- [ ] 01.1-02-PLAN.md -- Image delete ownership check + debug log removal + pagination cap
- [ ] 01.1-03-PLAN.md -- Add PUT and DELETE handlers for findings with ownership checks

### Phase 1.2: Database & Error Resilience

**Goal:** Add missing database indexes on high-traffic foreign-key columns (Finding.userId, Finding.status, Image.userId, Notification.recipientId, Comment.findingId), add Next.js error boundaries for graceful error handling, add Zod validation to tag/category routes, and add .env.example.
**Requirements**: See `docs/superpowers/plans/2026-03-11-db-error-resilience.md`
**Depends on:** Phase 1.1
**Plans:** 2 plans

Plans:
- [ ] 01.2-01-PLAN.md -- Add DB indexes via Prisma schema + Supabase migration
- [ ] 01.2-02-PLAN.md -- Error boundaries + Zod validation on tag/category routes + .env.example

### Phase 2: Finder Name Privacy & Öffentlich Opt-In

**Goal:** Add per-finding and per-user opt-in controls for displaying the finder's name on the Öffentlich community page, with a new settings page, schema migrations, and UI toggles — while ensuring lat/lng is never exposed.
**Requirements**: TBD
**Depends on:** Phase 1
**Plans:** 5 plans

Plans:
- [ ] 02-01-PLAN.md -- Schema migration, Prisma types, shadcn Switch install
- [ ] 02-02-PLAN.md -- API layer: Zod schema, POST update, PUT handler, community route, PATCH /api/user
- [ ] 02-03-PLAN.md -- Create form toggle + settings page
- [ ] 02-04-PLAN.md -- Edit finding form (new route)
- [ ] 02-05-PLAN.md -- Community page finderName display + sidebar/NavUser navigation
