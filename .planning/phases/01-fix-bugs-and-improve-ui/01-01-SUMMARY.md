---
phase: 01-fix-bugs-and-improve-ui
plan: 01
subsystem: ui
tags: [react-leaflet, next-dynamic, ssr, cloudinary, next-auth, sidebar]

requires: []
provides:
  - SSR-safe map rendering across all map import sites
  - Working filter propagation in FindingFilters
  - Session-driven sidebar with real user data
affects: [01-02, 01-03]

tech-stack:
  added: []
  patterns:
    - "next/dynamic with ssr:false for all react-leaflet consumers"
    - "useSession for sidebar user data"

key-files:
  created:
    - app/dashboard/findings/_components/FindingDetailMap.tsx
  modified:
    - app/dashboard/findings/map/page.tsx
    - app/dashboard/findings/_components/FindingDetail.tsx
    - components/ui/input/location-picker/location-modal.tsx
    - app/dashboard/findings/_components/FindingFilters.tsx
    - components/image-gallery/ImageGallery.tsx
    - components/AppSidebar.tsx
    - components/NavUser.tsx

key-decisions:
  - "Extracted FindingDetailMap into separate component for dynamic import isolation"
  - "Excluded onChange from useEffect deps with eslint-disable to prevent infinite re-render"
  - "Promoted Kategorien to top-level nav with LayoutGrid icon"

patterns-established:
  - "Dynamic import pattern: all react-leaflet usage must be behind next/dynamic ssr:false"
  - "Sidebar data pattern: derive from useSession, not hardcoded constants"

requirements-completed: []

duration: 3min
completed: 2026-03-08
---

# Phase 01 Plan 01: Fix Bugs and Wire User Data Summary

**Fixed react-leaflet SSR crashes via dynamic imports, filter propagation via useEffect, Cloudinary preset typo, and wired real NextAuth session data into sidebar**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-08T07:09:10Z
- **Completed:** 2026-03-08T07:12:44Z
- **Tasks:** 3
- **Files modified:** 7 (+ 1 created)

## Accomplishments
- All three map import sites (map page, FindingDetail, location modal) now use next/dynamic with ssr:false
- FindingFilters properly propagates search/sort changes via useEffect instead of broken useCallback
- Cloudinary upload preset corrected from "detektor-hud-preset" to "detektor-hub-preset"
- AppSidebar uses session data for user info and team name; NavUser shows real avatar with initials fallback

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix react-leaflet SSR crashes** - `9b403e5` (fix)
2. **Task 2: Fix FindingFilters useCallback bug and Cloudinary preset typo** - `e3b8882` (fix)
3. **Task 3: Wire real user data into AppSidebar and fix NavUser** - `bdd3671` (feat)

## Files Created/Modified
- `app/dashboard/findings/_components/FindingDetailMap.tsx` - Extracted map component for dynamic import
- `app/dashboard/findings/map/page.tsx` - Dynamic import of FindingsMap with ssr:false
- `app/dashboard/findings/_components/FindingDetail.tsx` - Uses FindingDetailMap via dynamic import
- `components/ui/input/location-picker/location-modal.tsx` - Dynamic import of SimpleMap with ssr:false
- `app/dashboard/findings/_components/FindingFilters.tsx` - useEffect replacing broken useCallback
- `components/image-gallery/ImageGallery.tsx` - Fixed Cloudinary preset name
- `components/AppSidebar.tsx` - Session-driven user/team data, restructured nav
- `components/NavUser.tsx` - getInitials helper, session image for avatar

## Decisions Made
- Extracted FindingDetailMap into separate file rather than wrapping inline JSX, for cleaner dynamic import isolation
- Added eslint-disable comment for react-hooks/exhaustive-deps on the onChange exclusion to document intentional choice
- Promoted Kategorien to top-level nav entry with LayoutGrid icon per plan

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All map pages render without SSR errors, ready for enhanced Funde page (Plan 03)
- Filters work correctly, ready for further UI improvements
- Sidebar displays real user data from session

## Self-Check: PASSED

All 8 files verified present. All 3 task commits verified in git log.

---
*Phase: 01-fix-bugs-and-improve-ui*
*Completed: 2026-03-08*
