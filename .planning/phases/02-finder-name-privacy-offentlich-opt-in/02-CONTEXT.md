# Phase 2: Finder Name Privacy & Öffentlich Opt-In - Context

**Gathered:** 2026-03-09
**Status:** Ready for planning
**Source:** PRD Express Path (docs/plans/2026-03-09-offentlich-privacy-design.md)

<domain>
## Phase Boundary

Add per-finding and per-user opt-in for showing the finder's name on the community (Öffentlich) page. Delivers schema changes, API updates, a new settings page, and UI toggles in finding create/edit forms — while preserving existing privacy guarantees (no lat/lng, no user data on community API).

</domain>

<decisions>
## Implementation Decisions

### Schema Changes
- Add `showFinderName Boolean @default(false)` to `Finding` model
- Add `defaultShowFinderName Boolean @default(false)` to `User` model
- Migration name: `add_finder_name_visibility`

### API — Community Findings (GET /api/community/findings)
- Include `user { name }` in Prisma query
- Return `finderName: f.showFinderName ? f.user.name : null` in anonymized response
- All other fields unchanged — lat/lng NEVER included (already enforced)

### API — Create Finding (POST /api/findings)
- Fetch `user.defaultShowFinderName` from session user on create
- Use it as the initial value for `showFinderName` on the new finding

### API — Edit Finding (PUT /api/findings/[id])
- Accept `showFinderName` boolean in request body and Zod schema
- Persist it to the database

### API — User Settings (PATCH /api/user) — new route
- Auth required
- Accepts `{ defaultShowFinderName: boolean }`
- Updates `User.defaultShowFinderName`

### Finding Form — Create (app/dashboard/findings/new/FindingsForm.tsx)
- Add toggle: "Meinen Namen bei diesem Fund öffentlich anzeigen"
- Default value from session user's `defaultShowFinderName`
- Add `showFinderName` boolean to Zod schema in `schemas/finding.ts`

### Finding Form — Edit (app/dashboard/findings/[id]/edit/)
- Same toggle as create form, pre-filled from `finding.showFinderName`

### Settings Page — new (app/dashboard/settings/page.tsx)
- Route: `/dashboard/settings`
- Single card with toggle: "Standard: Namen bei neuen Funden öffentlich anzeigen"
- Calls `PATCH /api/user` on change

### Sidebar Navigation
- Add "Einstellungen" nav item to `components/AppSidebar.tsx`
- Add link to NavUser menu

### Öffentlich Page (app/dashboard/community/page.tsx + CommunityCard)
- Add `finderName: string | null` to `CommunityFinding` type
- If `finderName` present, render as subtle byline: `text-xs text-muted-foreground` next to the date

### Privacy Constraints (locked)
- `lat`/`lng` NEVER in community API response — must remain enforced
- `showFinderName` defaults to `false` — opt-in, not opt-out
- `defaultShowFinderName` on User defaults to `false`
- Media library (`/api/user-images`) already private — no changes needed

### Claude's Discretion
- Exact placement of finder byline within CommunityCard layout
- Whether settings page uses a form submit or immediate onChange PATCH
- Sidebar icon for Einstellungen

</decisions>

<specifics>
## Specific Ideas

**Files to touch (from PRD):**

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Add `showFinderName` to Finding, `defaultShowFinderName` to User |
| `app/api/community/findings/route.ts` | Include user, return finderName conditionally |
| `app/api/findings/route.ts` (POST) | Read user default, set showFinderName |
| `app/api/findings/[id]/route.ts` (PUT) | Accept + persist showFinderName |
| `app/api/user/route.ts` (new) | PATCH handler for defaultShowFinderName |
| `schemas/finding.ts` | Add showFinderName boolean field |
| `app/dashboard/findings/new/FindingsForm.tsx` | Add toggle |
| `app/dashboard/findings/[id]/edit/` | Add toggle to edit form |
| `app/dashboard/settings/page.tsx` (new) | Settings page with default toggle |
| `components/AppSidebar.tsx` | Add Einstellungen nav item |
| `app/dashboard/community/page.tsx` | Show finderName in CommunityCard |

**UI copy (German):**
- Toggle label in finding form: "Meinen Namen bei diesem Fund öffentlich anzeigen"
- Settings toggle label: "Standard: Namen bei neuen Funden öffentlich anzeigen"
- Sidebar nav item: "Einstellungen"

</specifics>

<deferred>
## Deferred Ideas

None — PRD covers phase scope completely.

</deferred>

---

*Phase: 02-finder-name-privacy-offentlich-opt-in*
*Context gathered: 2026-03-09 via PRD Express Path*
