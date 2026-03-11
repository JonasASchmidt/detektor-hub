# Architecture Hardening — Design Document

> Generated from holistic architecture review on 2026-03-11.

## What This Is

A systematic hardening pass over the Detektorhub Next.js 16 codebase, addressing critical security gaps, reliability issues, and maintainability concerns identified in an expert architecture review.

## Scope

Split into two phases to keep each deployment small and reviewable:

- **Phase 1.1 — Security Hardening**: Close all authentication/authorization gaps, add missing CRUD handlers, fix pagination DoS vector, remove debug code.
- **Phase 1.2 — Database & Error Resilience**: Add missing DB indexes, error boundaries, Zod validation, `.env.example`.

Phase 1.3 (code splitting, standardizing error messages) is deferred — lower impact, no production risk.

---

## Phase 1.1: Security Hardening

### Problems

| # | File | Issue | Risk |
|---|------|-------|------|
| 1 | `app/api/tags/route.ts` | POST/PUT have no auth check | Anyone can create/edit tags |
| 2 | `app/api/tag-categories/route.ts` | POST has no auth check | Anyone can create categories |
| 3 | `app/api/tag-categories/[id]/route.ts` | DELETE has no auth check | Anyone can delete categories |
| 4 | `app/api/images/[id]/route.ts` | DELETE doesn't verify image ownership | Any user deletes any image |
| 5 | `app/api/images/[id]/route.ts` | `console.log({ cldResponse })` in prod | Info leakage |
| 6 | `app/api/images/bulk/route.ts` | Uses `getServerSession()` without `authOptions` | Inconsistent JWT validation |
| 7 | `app/api/findings/route.ts` | No upper bound on `pageSize` | OOM / DoS |
| 8 | `app/api/findings/[id]/route.ts` | Missing PUT handler | Users cannot edit their findings |
| 9 | `app/api/findings/[id]/route.ts` | Missing DELETE handler | Users cannot delete their findings |

### Approach

Each fix is surgical — no refactoring beyond what's needed:
- Auth guards: copy the existing `getServerSession(authOptions)` + 401 pattern from protected routes
- Ownership checks: query the resource first, compare `userId` to `session.user.id`
- Pagination: clamp `pageSize` to max 100
- PUT/DELETE handlers: follow the pattern in `/api/findings/[id]` GET (auth → fetch → ownership → mutate)
- Auth consistency: replace bare `getServerSession()` with `getServerSession(authOptions)` where missing

### Schema Note

The `finding.ts` Zod schema already covers all fields for creating a finding (`findingSchemaCompleted`). The PUT handler will reuse the same schema.

---

## Phase 1.2: Database & Error Resilience

### Problems

| # | Area | Issue | Risk |
|---|------|-------|------|
| 1 | `prisma/schema.prisma` | No index on `Finding.userId`, `Finding.status` | Full table scans on every filter query |
| 2 | `prisma/schema.prisma` | No index on `Image.userId` | Full scan on user image gallery |
| 3 | `prisma/schema.prisma` | No index on `Notification.recipientId` | Full scan on notification fetch |
| 4 | `app/api/images/[id]/route.ts` | Cloudinary delete and DB delete not atomic | Orphaned DB records on Cloudinary failure |
| 5 | `app/` | No `error.tsx` files | Component crash = blank white page |
| 6 | `app/api/*` | Most routes lack Zod validation on inputs | Unvalidated data reaches DB |
| 7 | Root | No `.env.example` | New devs don't know required env vars |

### Approach

**DB indexes**: Add `@@index` directives to Prisma schema → `npx prisma migrate dev`. All indexes are non-unique, non-breaking additions.

**Cloudinary atomicity**: Reverse the order — delete from DB first, then Cloudinary. A failed Cloudinary delete leaves an orphaned CDN asset (harmless, reclaimable) rather than an orphaned DB record (breaks UI). This is a pragmatic fix; a proper queue/retry is out of scope.

**Error boundaries**: Add minimal `error.tsx` files in the key segments: `app/dashboard/error.tsx`, `app/dashboard/findings/error.tsx`. These show a user-friendly German error message with a retry button.

**Zod validation**: Add input validation to the highest-risk routes not already covered: `/api/tags`, `/api/tag-categories`, `/api/auth/register`. Reuse the existing Zod + `safeParse` pattern.

**`.env.example`**: Document all required env vars, no values.

---

## Success Criteria

### Phase 1.1
- All tag/category mutation routes require a valid session
- Image delete verifies the requesting user owns the image
- Findings support full CRUD — users can create, read, update, and delete their own findings
- `pageSize` is clamped to 100 on all list endpoints
- `getServerSession` is called with `authOptions` everywhere
- No `console.log` in API routes

### Phase 1.2
- `prisma/schema.prisma` has `@@index` on all high-traffic foreign key columns
- `app/dashboard/error.tsx` and `app/dashboard/findings/error.tsx` exist and render
- Input validation covers auth register, tag creation, category creation
- `.env.example` lists all required variables
