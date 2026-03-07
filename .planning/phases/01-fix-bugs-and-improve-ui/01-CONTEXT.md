# Phase 1: Fix bugs and improve UI - Context

**Gathered:** 2026-03-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix existing bugs (map 500, Cloudinary upload, missing avatar, zustand import) and improve UI: add a prominent app header bar, fix navigation behavior, merge "Alle Funde" into the main Funde page with extensive filters, and wire up real user data throughout the sidebar.

</domain>

<decisions>
## Implementation Decisions

### App Header Bar
- Full viewport width black background header bar, 60px height
- Large font (~72px) showing breadcrumb: "Detektor Hub > [Page Name]"
- German labels for breadcrumb segments: "findings" → "Funde", "image-gallery" → "Foto-Gallerie", "tags" → "Tags", etc.
- All breadcrumb segments are clickable links (except current page)
- Root breadcrumb label: "Detektor Hub"
- Dynamic routes (e.g., /dashboard/findings/[id]) show the finding name, not the ID
- Header spans full viewport width, sits above/over the sidebar

### Sidebar Toggle
- Move the sidebar collapse/expand toggle from the current small header into the sidebar bottom, above the user menu

### Navigation Behavior
- All main nav entries ("Funde", "Tags", "User", "Kategorien") navigate to their own page on click AND expand the submenu
- "Alle Funde" removed from the "Funde" submenu (content merged into main Funde page)
- "Kategorien" promoted from child of "Tags" to its own top-level nav entry with its own icon

### Team Switcher
- Keep the team switcher functionality at the top of the sidebar
- Default team name: "[User's FirstName] Team" (from session data)
- Plan label: "Starter Plan" (instead of "Enterprise")

### Funde Main Page
- Top section: overview dashboard with stat cards (total finds, finds this month, most used tag, unidentified count) AND a mini map showing recent find locations
- Below: full findings list with inline filter bar
- Filter dimensions: tags, date range, location radius, status (identified/unidentified, reported/unreported)
- Sort options: newest, oldest, A-Z (keep existing)
- Search: text search (keep existing)
- Filter bar style: horizontal inline bar above the list with dropdowns/chips
- Filters persisted in URL query params (shareable, survives refresh)

### User Data / Avatar
- NavUser: use `session.user.image` for avatar instead of hardcoded `/avatars/shadcn.jpg`
- Avatar fallback: user's actual initials from session name (replace hardcoded "CN")
- NavUser already uses session for name/email — just fix the avatar and fallback

### Bug Fixes
- Fix map page 500 error at /dashboard/findings/map (likely react-leaflet SSR/undefined component issue — React error #130)
- Fix Cloudinary upload: preset "detektor-hud-preset" not found — verify/create in Cloudinary dashboard
- Fix zustand deprecated default export warning — use `import { create } from 'zustand'`

### Claude's Discretion
- Exact stat card styling and layout proportions
- Mini map height and zoom level
- Filter chip/dropdown exact styling
- Loading states and skeletons for dashboard stats
- Error handling for map component

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `app/dashboard/Breadcrumbs.tsx`: Existing breadcrumb component — needs significant rework for the new header bar design
- `app/dashboard/layout.tsx`: Dashboard layout with SidebarProvider — header rendering happens here
- `components/NavMain.tsx`: Collapsible nav component — needs modification for click-to-navigate behavior
- `components/AppSidebar.tsx`: Sidebar data structure with navMain items — needs restructuring (promote Kategorien, remove Alle Funde)
- `components/TeamSwitcher.tsx`: Team switcher dropdown — needs to pull from session data
- `components/NavUser.tsx`: Already uses NextAuth session for name/email — just needs avatar/fallback fix
- `app/dashboard/findings/_components/FindingFilters.tsx`: Existing filter bar with search + sort — needs extension for tags, date, location, status
- `app/dashboard/findings/_components/FindingMap.tsx`: Map component using react-leaflet — can be reused for mini map
- `app/dashboard/findings/_components/FindingList.tsx`: Existing findings list component
- `app/dashboard/findings/_components/FindingCard.tsx`: Individual finding card component
- `components/ui/`: Full shadcn/ui component library available

### Established Patterns
- Next.js App Router with server components (layout.tsx) and client components ("use client")
- NextAuth for auth with `getServerSession(authOptions)` in server components, `useSession()` in client
- Prisma ORM for database
- react-leaflet for maps with OpenStreetMap tiles
- next-cloudinary for image uploads via CldUploadWidget
- shadcn/ui component library (sidebar, dropdown, avatar, etc.)
- German language UI labels throughout

### Integration Points
- `app/dashboard/layout.tsx`: Where the new header bar will be added (above SidebarProvider or restructured)
- `components/AppSidebar.tsx`: Where nav data structure lives (line 31-78)
- `app/dashboard/findings/page.tsx`: Current findings page — will become the enhanced Funde main page
- `app/_hooks/useFindings.ts`: Data fetching hook for findings

</code_context>

<specifics>
## Specific Ideas

- Header bar: "Detektor Hub > Funde" displayed prominently — like a full-width app title bar, not a subtle breadcrumb
- Mini map in the dashboard section should show recent find locations
- The team switcher should feel personalized — "[FirstName] Team" makes it feel like your own workspace

</specifics>

<deferred>
## Deferred Ideas

- Design system with Figma (captured as separate todo)
- Multi-team support beyond the team switcher scaffold

</deferred>

---

*Phase: 01-fix-bugs-and-improve-ui*
*Context gathered: 2026-03-07*
