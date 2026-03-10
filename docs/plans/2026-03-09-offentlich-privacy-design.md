# Design: Öffentlich Privacy & Finder Name Opt-In

## Context

The "Öffentlich" page (`/dashboard/community`) shows all finds to all logged-in users.
The `/api/community/findings` route already strips `lat`/`lng` and user data — this must never change.
The media library (`/api/user-images`) is already scoped to the logged-in user — no change needed.

## Requirements

1. **Per-finding opt-in**: Each finding has a toggle — "Meinen Namen bei diesem Fund öffentlich anzeigen". Off by default.
2. **User default**: In a personal settings page, users can set the default value that pre-fills the toggle on new findings.
3. **Public display**: On the Öffentlich page, if a finding has the opt-in enabled, the finder's name is shown as a subtle byline. Otherwise anonymous.
4. **Position data**: lat/lng is NEVER exposed on the Öffentlich page — already enforced.

## Schema Changes

### `Finding` model — add field:
```prisma
showFinderName Boolean @default(false)
```

### `User` model — add field:
```prisma
defaultShowFinderName Boolean @default(false)
```

Migration name: `add_finder_name_visibility`

## API Changes

### `GET /api/community/findings`
- Include `user { name }` in Prisma query
- Anonymized response adds: `finderName: f.showFinderName ? f.user.name : null`
- All other fields stay the same (no lat/lng, no userId)

### `POST /api/findings` (create finding)
- Read `session.user.id` → fetch `user.defaultShowFinderName`
- Set `showFinderName` from that default when creating the finding

### `PUT /api/findings/[id]` (edit finding)
- Accept `showFinderName` boolean in the request body/schema
- Persist it

### `PATCH /api/user` (new route)
- Auth required
- Accepts `{ defaultShowFinderName: boolean }`
- Updates `User.defaultShowFinderName`

## Frontend Changes

### Finding form — create (`app/dashboard/findings/new/FindingsForm.tsx`)
- Add a toggle/checkbox field: "Meinen Namen bei diesem Fund öffentlich anzeigen"
- Default value fetched from the session user's `defaultShowFinderName` (pass via server component or API)
- Add `showFinderName` to the Zod schema in `schemas/finding.ts`

### Finding edit (`app/dashboard/findings/[id]/edit`)
- Same toggle as create form, pre-filled from existing `finding.showFinderName`

### Settings page — new (`app/dashboard/settings/page.tsx`)
- Route: `/dashboard/settings`
- Single card with a toggle: "Standard: Namen bei neuen Funden öffentlich anzeigen"
- Calls `PATCH /api/user` on change
- Add "Einstellungen" link to the sidebar (`components/AppSidebar.tsx`) and NavUser menu

### Öffentlich page (`app/dashboard/community/page.tsx`) + `CommunityCard`
- `CommunityFinding` type: add `finderName: string | null`
- `CommunityCard`: if `finderName` is present, render it as a subtle byline (e.g. `text-xs text-muted-foreground`) next to the date

## Key Constraints

- `lat`/`lng` NEVER in community API response (already enforced, must stay)
- `showFinderName` defaults to `false` — opt-in, not opt-out
- `defaultShowFinderName` on User also defaults to `false`
- Media library (`/api/user-images`) already private — no changes needed

## Files to Touch

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
