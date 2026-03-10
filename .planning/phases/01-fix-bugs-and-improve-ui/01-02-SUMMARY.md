---
phase: 01-fix-bugs-and-improve-ui
plan: 02
subsystem: ui
tags: [next.js, react, breadcrumbs, sidebar, navigation, tailwind]

requires:
  - phase: 01-fix-bugs-and-improve-ui/01
    provides: "Real nav URLs and sidebar structure from Plan 01"
provides:
  - "Full-width black AppHeaderBar with German breadcrumbs and finding name resolution"
  - "Restructured dashboard layout with header above sidebar"
  - "Click-to-navigate + expand NavMain behavior"
  - "Next.js Link-based sub-navigation (no full page reloads)"
affects: [ui, navigation, layout]

tech-stack:
  added: []
  patterns:
    - "AppHeaderBar as layout-level client component outside SidebarProvider"
    - "useFindingName hook for client-side entity name resolution"
    - "Controlled collapsible state in NavMain for navigate + expand"

key-files:
  created:
    - components/AppHeaderBar.tsx
  modified:
    - app/dashboard/layout.tsx
    - components/NavMain.tsx
    - components/AppSidebar.tsx
    - components/ui/sidebar.tsx

key-decisions:
  - "API returns { finding } not { name }, adjusted hook to access data.finding.name"
  - "Used CSS variable --sidebar-height for sidebar offset instead of hardcoded calc"
  - "Sidebar min-h-svh changed to min-h-0 for proper flex containment under header"

patterns-established:
  - "AppHeaderBar pattern: client component at layout top, outside SidebarProvider"
  - "German label map (SEGMENT_LABELS) for URL-to-German breadcrumb translation"

requirements-completed: []

duration: 2min
completed: 2026-03-08
---

# Phase 01 Plan 02: App Header Bar and Navigation Summary

**Full-width black header bar with German breadcrumbs, finding name resolution, and click-to-navigate sidebar**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-08T07:13:37Z
- **Completed:** 2026-03-08T07:16:00Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Full-width black AppHeaderBar with "Detektor Hub > [German Page Name]" breadcrumbs at top of every dashboard page
- Dynamic finding name resolution via useFindingName hook (UUIDs display as finding names)
- Dashboard layout restructured: header above SidebarProvider, sidebar offset by 60px
- NavMain click-to-navigate + expand behavior with Next.js Link for all navigation

## Task Commits

Each task was committed atomically:

1. **Task 1: Create AppHeaderBar and restructure dashboard layout** - `22add63` (feat)
2. **Task 2: Update NavMain for click-to-navigate + expand** - `b8f4c5f` (feat)

## Files Created/Modified
- `components/AppHeaderBar.tsx` - Full-width black header with German breadcrumbs and finding name resolution
- `app/dashboard/layout.tsx` - Restructured: header above SidebarProvider, removed old breadcrumbs
- `components/NavMain.tsx` - Click-to-navigate + expand with controlled state and Next.js Link
- `components/AppSidebar.tsx` - Added SidebarTrigger in footer above NavUser
- `components/ui/sidebar.tsx` - Adjusted height calculations for 60px header offset
- `app/dashboard/Breadcrumbs.tsx` - Deleted (replaced by AppHeaderBar)

## Decisions Made
- API route returns `{ finding }` wrapper, not flat `{ name }` -- adjusted useFindingName hook to access `data.finding.name`
- Used CSS variable `--sidebar-height` on SidebarProvider for sidebar height offset rather than modifying the sidebar component's hardcoded values
- Changed sidebar's `min-h-svh` to `min-h-0` and `h-svh` to `h-[var(--sidebar-height)]` for proper flex containment under the fixed header

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Header bar and navigation complete, ready for visual polish in Plan 03
- All internal links now use Next.js Link (no full page reloads)

## Self-Check: PASSED

- components/AppHeaderBar.tsx: FOUND
- app/dashboard/Breadcrumbs.tsx: CONFIRMED DELETED
- Commit 22add63: FOUND
- Commit b8f4c5f: FOUND

---
*Phase: 01-fix-bugs-and-improve-ui*
*Completed: 2026-03-08*
