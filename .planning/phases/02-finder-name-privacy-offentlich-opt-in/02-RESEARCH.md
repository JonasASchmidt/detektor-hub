# Phase 2: Finder Name Privacy & Öffentlich Opt-In - Research

**Researched:** 2026-03-09
**Domain:** Next.js App Router API routes, Prisma schema migrations, shadcn/ui Switch, NextAuth JWT session
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Schema Changes**
- Add `showFinderName Boolean @default(false)` to `Finding` model
- Add `defaultShowFinderName Boolean @default(false)` to `User` model
- Migration name: `add_finder_name_visibility`

**API — Community Findings (GET /api/community/findings)**
- Include `user { name }` in Prisma query
- Return `finderName: f.showFinderName ? f.user.name : null` in anonymized response
- All other fields unchanged — lat/lng NEVER included (already enforced)

**API — Create Finding (POST /api/findings)**
- Fetch `user.defaultShowFinderName` from session user on create
- Use it as the initial value for `showFinderName` on the new finding

**API — Edit Finding (PUT /api/findings/[id])**
- Accept `showFinderName` boolean in request body and Zod schema
- Persist it to the database

**API — User Settings (PATCH /api/user) — new route**
- Auth required
- Accepts `{ defaultShowFinderName: boolean }`
- Updates `User.defaultShowFinderName`

**Finding Form — Create (app/dashboard/findings/new/FindingsForm.tsx)**
- Add toggle: "Meinen Namen bei diesem Fund öffentlich anzeigen"
- Default value from session user's `defaultShowFinderName`
- Add `showFinderName` boolean to Zod schema in `schemas/finding.ts`

**Finding Form — Edit (app/dashboard/findings/[id]/edit/)**
- Same toggle as create form, pre-filled from `finding.showFinderName`

**Settings Page — new (app/dashboard/settings/page.tsx)**
- Route: `/dashboard/settings`
- Single card with toggle: "Standard: Namen bei neuen Funden öffentlich anzeigen"
- Calls `PATCH /api/user` on change

**Sidebar Navigation**
- Add "Einstellungen" nav item to `components/AppSidebar.tsx`
- Add link to NavUser menu

**Öffentlich Page (app/dashboard/community/page.tsx + CommunityCard)**
- Add `finderName: string | null` to `CommunityFinding` type
- If `finderName` present, render as subtle byline: `text-xs text-muted-foreground` next to the date

**Privacy Constraints (locked)**
- `lat`/`lng` NEVER in community API response — must remain enforced
- `showFinderName` defaults to `false` — opt-in, not opt-out
- `defaultShowFinderName` on User defaults to `false`
- Media library (`/api/user-images`) already private — no changes needed

### Claude's Discretion
- Exact placement of finder byline within CommunityCard layout
- Whether settings page uses a form submit or immediate onChange PATCH
- Sidebar icon for Einstellungen

### Deferred Ideas (OUT OF SCOPE)
None — PRD covers phase scope completely.
</user_constraints>

---

## Summary

This phase is a self-contained feature addition: two new boolean columns (one on `Finding`, one on `User`), a new API route (`PATCH /api/user`), a new PUT handler on the existing findings route, and UI toggles in the create form, edit form, and a new settings page. The work is additive — no existing behaviour changes, only new fields and conditionally surfaced data.

The primary complexity is the edit form: there is currently no edit route or edit form at all (`app/dashboard/findings/[id]/` only renders a detail view, `app/api/findings/[id]/route.ts` only has GET). The edit form must be created from scratch as part of this phase.

The secondary complexity is reading `user.defaultShowFinderName` in the POST /api/findings handler, which requires an extra DB lookup because JWT session tokens only carry `id` and `role` — not the full user record.

**Primary recommendation:** Build schema migration first via Supabase MCP, then API layer, then UI. Add shadcn Switch component before building any toggle UI.

---

## Current Codebase State (verified by reading source files)

### Schema — current state
```
Finding model fields (prisma/schema.prisma):
  - NO showFinderName field yet
  - HAS: userId String → user User relation
  - HAS: status, reported, name, latitude, longitude, ...

User model fields:
  - NO defaultShowFinderName field yet
  - HAS: id, name, email, password, role, ...
```

### API Routes — current state

| Route | Methods | Status |
|-------|---------|--------|
| `app/api/community/findings/route.ts` | GET | EXISTS — no user include, no finderName in output |
| `app/api/findings/route.ts` | GET, POST | EXISTS — POST creates finding, does NOT set showFinderName, does NOT read user defaults |
| `app/api/findings/[id]/route.ts` | GET only | EXISTS — no PUT handler |
| `app/api/user/route.ts` | — | DOES NOT EXIST — must be created |

### UI Components — current state

| Component | Status |
|-----------|--------|
| `components/ui/switch.tsx` | DOES NOT EXIST — must be added via shadcn |
| `app/dashboard/settings/page.tsx` | DOES NOT EXIST — must be created |
| `app/dashboard/findings/[id]/edit/` | DOES NOT EXIST — detail page exists but no edit route |
| `components/AppSidebar.tsx` — navMain array | EXISTS — 2 top-level items, "Einstellungen" not present |
| `components/NavUser.tsx` — dropdown items | EXISTS — has placeholder items (Account, Your Team, Billing, Notifications), all non-functional |

### Finding Detail Page
The `app/dashboard/findings/[id]/page.tsx` uses a server component that fetches from Prisma directly and renders `<FindingDetail>`. There is no edit form here. The edit form for this phase (`app/dashboard/findings/[id]/edit/`) must be a new route.

### Forms — current state
`FindingsForm.tsx` (create) uses:
- `react-hook-form` with `zodResolver`
- `useForm<FindingFormData>` — `FindingFormData` interface and `findingSchemaCompleted` Zod schema both in `schemas/finding.ts`
- No `showFinderName` field anywhere yet
- `defaultValues` are hardcoded — does not currently read from session

### Auth / Session
- Strategy: JWT (`session.strategy: "jwt"`)
- Session carries: `user.id`, `user.role`, `user.name`, `user.email`, `user.image`
- Session does NOT carry `defaultShowFinderName` — must fetch from DB in POST handler
- `getServerSession(authOptions)` pattern used consistently across all API routes

---

## Standard Stack

### Core (all already installed)
| Library | Version | Purpose | Notes |
|---------|---------|---------|-------|
| next | 16.x | App Router, API routes | Turbopack in dev |
| prisma | current | ORM + schema migrations | Schema in `prisma/schema.prisma` |
| @prisma/client | current | Generated types | Regenerate after schema change |
| next-auth v4 | 4.x | JWT session, `getServerSession` | `authOptions` in `lib/auth.ts` |
| zod | current | Schema validation | Used in `schemas/finding.ts` |
| react-hook-form | current | Form state + validation | `zodResolver` pattern |
| @hookform/resolvers | current | Zod bridge | Already in use |
| shadcn/ui | n/a | Component library | Switch not yet installed |
| lucide-react | current | Icons | For Einstellungen sidebar icon |

### Component to Add
| Component | Install Command | Purpose |
|-----------|----------------|---------|
| shadcn Switch | `npx shadcn@latest add switch` | Toggle UI for opt-in controls |

---

## Architecture Patterns

### Pattern 1: API Route Auth Check
All routes follow this exact pattern — use it for the new PATCH /api/user:
```typescript
// Source: verified from app/api/community/findings/route.ts and app/api/findings/route.ts
const session = await getServerSession(authOptions);
if (!session?.user?.id) {
  return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
}
```

### Pattern 2: Zod Validation in API Route
```typescript
// Source: verified from app/api/findings/route.ts POST handler
const parseResult = findingSchemaCompleted.safeParse(body);
if (!parseResult.success) {
  return Response.json(
    { errors: parseResult.error.flatten().fieldErrors },
    { status: 400 }
  );
}
```

### Pattern 3: react-hook-form Boolean Field with Controller
The existing form uses `register()` for text/number inputs. For a Switch (checkbox-like boolean), use `Controller` from react-hook-form:
```typescript
// Pattern for boolean toggle with shadcn Switch
import { Controller } from "react-hook-form";
import { Switch } from "@/components/ui/switch";

<Controller
  control={control}
  name="showFinderName"
  render={({ field }) => (
    <div className="flex items-center gap-3">
      <Switch
        checked={field.value}
        onCheckedChange={field.onChange}
        id="showFinderName"
      />
      <Label htmlFor="showFinderName">
        Meinen Namen bei diesem Fund öffentlich anzeigen
      </Label>
    </div>
  )}
/>
```

### Pattern 4: Sidebar Nav Item (no sub-items)
Items without sub-items in `navMain` render as plain links with icon. Add to `components/AppSidebar.tsx`:
```typescript
// Source: verified from components/AppSidebar.tsx navMain array
{
  title: "Einstellungen",
  url: "/dashboard/settings",
  icon: SettingsIcon,  // from lucide-react
}
```

### Pattern 5: NavUser Dropdown Link
Add a `DropdownMenuItem` with `Link` inside to the NavUser dropdown:
```typescript
// Source: verified from components/NavUser.tsx structure
import Link from "next/link";
<DropdownMenuItem asChild>
  <Link href="/dashboard/settings">
    <Settings />
    Einstellungen
  </Link>
</DropdownMenuItem>
```

### Pattern 6: Reading User Default in POST /api/findings
JWT session does not carry `defaultShowFinderName`. Fetch from DB:
```typescript
// In POST /api/findings — after session check
const user = await prisma.user.findUnique({
  where: { id: session.user.id },
  select: { defaultShowFinderName: true },
});
// Then use user?.defaultShowFinderName ?? false as initial showFinderName value
```

### Pattern 7: Immediate onChange PATCH for Settings Page
The settings page toggle should PATCH immediately on change (no form submit button needed — simpler UX for a single boolean):
```typescript
const handleToggle = async (value: boolean) => {
  await fetch("/api/user", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ defaultShowFinderName: value }),
  });
};
```

### Pattern 8: Community API Anonymization
The current community route maps findings explicitly — lat/lng is excluded by omission. The finderName addition follows the same pattern:
```typescript
// Source: verified from app/api/community/findings/route.ts
const anonymized = findings.map((f) => ({
  id: f.id,
  name: f.name,
  // ... other safe fields ...
  finderName: f.showFinderName ? f.user.name : null,  // ADD THIS
  // latitude/longitude NEVER included
}));
```

### Prisma Include for Community Route
The current community route `include: { images: true, tags: true }` must add `user: { select: { name: true } }`:
```typescript
include: {
  images: true,
  tags: true,
  user: { select: { name: true } },
}
```

### Recommended Project Structure (new files this phase)
```
app/
  api/
    user/
      route.ts              # NEW — PATCH handler for defaultShowFinderName
  dashboard/
    settings/
      page.tsx              # NEW — settings page with default toggle
    findings/
      [id]/
        edit/
          page.tsx          # NEW — edit route (server component, fetches finding)
          EditFindingForm.tsx # NEW — edit form component with showFinderName toggle
```

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Toggle UI | Custom checkbox | shadcn Switch (`npx shadcn@latest add switch`) | Accessible, consistent with design system, handles checked/indeterminate states |
| Form boolean field | `<input type="checkbox">` raw | `Controller` + `Switch` from react-hook-form | Integrates with form validation, reset, and dirty state |
| Schema migration | Manual SQL via Supabase dashboard | Prisma schema edit + SQL via Supabase MCP | Keeps schema.prisma as source of truth |

---

## Common Pitfalls

### Pitfall 1: PUT handler auth missing ownership check
**What goes wrong:** PUT /api/findings/[id] updates any finding if authenticated, not just the current user's.
**Why it happens:** The GET handler at that route has no session check (it's read-only), and the PUT is modelled after it.
**How to avoid:** Always add `where: { id, userId: session.user.id }` in the Prisma update — use `updateMany` and check `count > 0`, or `findUnique` first.

### Pitfall 2: Forgetting `prisma generate` after schema change
**What goes wrong:** TypeScript types for `Finding` and `User` are stale — `showFinderName` won't exist on Prisma types.
**Why it happens:** `@prisma/client` generates types at build time; local dev needs manual regeneration.
**How to avoid:** Run `npx prisma generate` immediately after applying the migration.

### Pitfall 3: JWT session does not update automatically
**What goes wrong:** If `defaultShowFinderName` were added to the session JWT, it would be stale for the rest of the session after a PATCH.
**Why it happens:** JWT sessions encode data at sign-in time.
**How to avoid:** Do NOT put `defaultShowFinderName` in the session JWT. Always fetch from DB in the POST /api/findings handler (Pattern 6 above). This is already the correct approach per the locked decisions.

### Pitfall 4: Community route count query doesn't filter
**What goes wrong:** The `prisma.finding.count()` in the community route has no filter — it counts ALL findings, not just those relevant to the page.
**Why it happens:** Already a pre-existing issue in the current code.
**How to avoid:** Not a blocker for this phase — don't try to fix it here, just be aware when adding the `user` include.

### Pitfall 5: `react-hook-form` `register()` doesn't work for Switch
**What goes wrong:** `{...register("showFinderName")}` spread on a `<Switch>` doesn't wire up correctly because Switch uses `onCheckedChange`, not `onChange`.
**Why it happens:** shadcn Switch is a Radix-based component with a different event API.
**How to avoid:** Always use `Controller` for Switch fields (Pattern 3 above).

### Pitfall 6: Settings page initial state mismatch
**What goes wrong:** The settings toggle renders with `false` initially even if DB has `true`, causing a flash/wrong state.
**Why it happens:** The component renders before data is fetched.
**How to avoid:** The settings page should be a server component that fetches `user.defaultShowFinderName` from Prisma directly (no API call needed — it's already authenticated server-side), then passes it as a prop to a client component for the interactive toggle.

### Pitfall 7: Edit form route — no existing edit page
**What goes wrong:** Assuming `/dashboard/findings/[id]` has an edit form — it does not. The detail page renders `FindingDetail` which is a display-only component.
**Why it happens:** Edit was never implemented.
**How to avoid:** Create a new route at `app/dashboard/findings/[id]/edit/` — this is a clean new addition. Do not modify the existing detail page.

---

## Migration Strategy

Migrations in this project are applied via Supabase MCP, NOT via `prisma migrate dev`. The workflow is:
1. Edit `prisma/schema.prisma` — add the two fields
2. Use Supabase MCP to run the raw SQL migration
3. Run `npx prisma generate` to update TypeScript types

**SQL for migration `add_finder_name_visibility`:**
```sql
ALTER TABLE "Finding" ADD COLUMN "showFinderName" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "defaultShowFinderName" BOOLEAN NOT NULL DEFAULT false;
```

**Confidence:** HIGH — confirmed by MEMORY.md ("Migration applied via Supabase MCP (not prisma migrate)") and by the CONTEXT.md locked decision specifying the migration name.

---

## Files to Touch (complete map)

| File | Action | What changes |
|------|--------|-------------|
| `prisma/schema.prisma` | Edit | Add `showFinderName` to Finding, `defaultShowFinderName` to User |
| `schemas/finding.ts` | Edit | Add `showFinderName: z.boolean().default(false)` to Zod schema; add to `FindingFormData` interface |
| `app/api/community/findings/route.ts` | Edit | Add `user: { select: { name: true } }` to include; add `finderName` to anonymized map |
| `app/api/findings/route.ts` | Edit (POST) | Fetch user `defaultShowFinderName` from DB; pass to `prisma.finding.create` |
| `app/api/findings/[id]/route.ts` | Edit (add PUT) | Add PUT handler: auth + ownership check, accept `showFinderName`, update DB |
| `app/api/user/route.ts` | Create | New file — PATCH handler for `defaultShowFinderName` |
| `app/dashboard/findings/new/FindingsForm.tsx` | Edit | Add Controller+Switch for `showFinderName`; fetch user default for `defaultValues` |
| `app/dashboard/findings/new/FindingsPage.tsx` | Likely edit | Pass user's `defaultShowFinderName` down to FindingsForm |
| `app/dashboard/findings/[id]/edit/page.tsx` | Create | New server component — fetch finding, render edit form |
| `app/dashboard/findings/[id]/edit/EditFindingForm.tsx` | Create | Client form component with showFinderName toggle |
| `app/dashboard/settings/page.tsx` | Create | Server component — fetch user default, render settings client |
| `components/AppSidebar.tsx` | Edit | Add Einstellungen to navMain array |
| `components/NavUser.tsx` | Edit | Add Einstellungen link to dropdown |
| `app/dashboard/community/page.tsx` | Edit | Add `finderName` to `CommunityFinding` type; render byline in CommunityCard |
| `components/ui/switch.tsx` | Create | `npx shadcn@latest add switch` |

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None configured |
| Config file | None — no test runner in project |
| Quick run command | N/A |
| Full suite command | N/A |

Per `CLAUDE.md`: "No test runner is configured yet." Per `.planning/config.json`: `nyquist_validation: true`.

### Phase Requirements → Test Map
| Behavior | Test Type | Automated Command | Notes |
|----------|-----------|-------------------|-------|
| `showFinderName` field exists on Finding | manual | — | Verified via `npx prisma studio` or DB query |
| `defaultShowFinderName` field exists on User | manual | — | Verified via `npx prisma studio` |
| Community API never returns lat/lng | smoke | `curl /api/community/findings` + inspect | Check response body |
| Community API returns `finderName: null` when opt-out | smoke | manual API test | |
| Community API returns `finderName: "Name"` when opt-in | smoke | manual API test | |
| PATCH /api/user updates defaultShowFinderName | smoke | manual API test | |
| PUT /api/findings/[id] updates showFinderName | smoke | manual API test | |
| Toggle appears in create form | visual | manual browser check | |
| Toggle appears in edit form | visual | manual browser check | |
| Settings page renders at /dashboard/settings | visual | manual browser check | |
| Einstellungen appears in sidebar | visual | manual browser check | |

### Wave 0 Gaps
- [ ] No test framework installed — all validation is manual/smoke testing via browser and curl
- [ ] `npx shadcn@latest add switch` — must run before building toggle UI

---

## Open Questions

1. **Who can access the edit form?**
   - What we know: There is currently no edit route; the detail page shows the finder's own data
   - What's unclear: Should the edit route be restricted to the finding's owner only, or also admins?
   - Recommendation: Restrict to `userId === session.user.id` in the PUT handler; the edit page server component should check ownership and redirect if unauthorized

2. **FindingsForm.tsx — how to get user default for `defaultValues`?**
   - What we know: `FindingsForm` is a client component; `FindingsPage.tsx` is presumably a server component
   - What's unclear: Whether FindingsPage already fetches session/user data to pass down
   - Recommendation: Make `FindingsPage.tsx` fetch `user.defaultShowFinderName` server-side and pass as prop to `FindingsForm`; avoids client-side DB access

3. **Settings page: server or client initial render?**
   - What we know: Claude's discretion on whether to use immediate onChange PATCH or form submit
   - Recommendation (per discretion): Server component fetches initial `defaultShowFinderName` from Prisma, passes to a thin client wrapper that handles the Switch and fires PATCH on change — no form submit needed

---

## Sources

### Primary (HIGH confidence)
- Codebase: `prisma/schema.prisma` — verified current schema, confirmed missing fields
- Codebase: `app/api/community/findings/route.ts` — verified anonymization logic, no user include
- Codebase: `app/api/findings/route.ts` — verified POST handler, no showFinderName, no user default lookup
- Codebase: `app/api/findings/[id]/route.ts` — verified GET-only, no PUT handler exists
- Codebase: `components/AppSidebar.tsx` — verified navMain structure, no Einstellungen
- Codebase: `components/NavUser.tsx` — verified dropdown structure, placeholder items
- Codebase: `app/dashboard/community/page.tsx` — verified CommunityFinding type, CommunityCard layout
- Codebase: `app/dashboard/findings/new/FindingsForm.tsx` — verified form structure, register pattern
- Codebase: `schemas/finding.ts` — verified Zod schema and FindingFormData interface
- Codebase: `lib/auth.ts` — verified JWT strategy, session carries id + role only
- Codebase: `components/ui/` directory listing — confirmed Switch not installed
- MEMORY.md — confirmed Supabase MCP migration workflow
- CONTEXT.md — locked decisions, migration name

### Secondary (MEDIUM confidence)
- shadcn/ui docs pattern: `Controller` + `Switch` for react-hook-form boolean fields — standard pattern, verified by shadcn docs approach
- Supabase MCP migration SQL syntax — standard PostgreSQL `ALTER TABLE ADD COLUMN`

---

## Metadata

**Confidence breakdown:**
- Current codebase state: HIGH — read all source files directly
- Standard stack: HIGH — all libraries already installed and in use
- Migration workflow: HIGH — confirmed by MEMORY.md
- Architecture patterns: HIGH — derived directly from existing code
- Missing PUT handler / edit form: HIGH — confirmed by reading the route file (GET only)
- Switch component installation: HIGH — confirmed absence by directory listing

**Research date:** 2026-03-09
**Valid until:** 2026-04-09 (stable project, no fast-moving dependencies)
