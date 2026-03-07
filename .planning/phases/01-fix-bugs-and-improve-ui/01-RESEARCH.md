# Phase 1: Fix bugs and improve UI - Research

**Researched:** 2026-03-07
**Domain:** Next.js App Router UI bugs, react-leaflet SSR, Cloudinary, shadcn/ui sidebar
**Confidence:** HIGH

## Summary

This phase covers six work areas: (1) a full-width black app header bar with breadcrumb navigation, (2) sidebar navigation restructuring, (3) fixing the react-leaflet SSR crash, (4) fixing the Cloudinary upload preset, (5) merging "Alle Funde" into an enhanced Funde main page with dashboard stats and filters, and (6) wiring real user data into sidebar components.

The codebase is a standard Next.js 15 App Router project with React 19, shadcn/ui, Prisma, react-leaflet 5.0.0-rc.2, and next-cloudinary 6.16. The existing code is well-structured with clear component boundaries. The main technical risk is the react-leaflet SSR fix, which has a well-known solution (`next/dynamic` with `ssr: false`). The Cloudinary preset issue is a configuration problem (wrong preset name in the Cloudinary dashboard). All UI work uses existing shadcn/ui patterns.

**Primary recommendation:** Fix bugs first (map SSR, Cloudinary preset, user data), then restructure navigation/header, then build the enhanced Funde page last since it depends on stable map and filter infrastructure.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Full viewport width black background header bar, 60px height, ~72px font
- Breadcrumb format: "Detektor Hub > [Page Name]" with German labels
- All breadcrumb segments clickable (except current page)
- Dynamic routes show finding name, not ID
- Header spans full viewport width, sits above/over the sidebar
- Sidebar toggle moved to sidebar bottom, above user menu
- Main nav entries navigate AND expand submenu on click
- "Alle Funde" removed from submenu, "Kategorien" promoted to top-level
- Team switcher: "[FirstName] Team" / "Starter Plan"
- Funde page: stat cards + mini map + full list with inline filter bar
- Filter dimensions: tags, date range, location radius, status
- Filters persisted in URL query params
- NavUser: use session.user.image, fallback to actual initials
- Fix map page SSR error (react-leaflet)
- Fix Cloudinary preset "detektor-hud-preset" not found
- Fix zustand deprecated default export

### Claude's Discretion
- Exact stat card styling and layout proportions
- Mini map height and zoom level
- Filter chip/dropdown exact styling
- Loading states and skeletons for dashboard stats
- Error handling for map component

### Deferred Ideas (OUT OF SCOPE)
- Design system with Figma
- Multi-team support beyond the team switcher scaffold
</user_constraints>

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Notes |
|---------|---------|---------|-------|
| next | ^15.5.12 | App Router framework | Server/client component split |
| react | ^19.0.0 | UI framework | React 19 |
| tailwindcss | ^3.4.1 | Styling | Utility-first CSS |
| shadcn/ui (radix) | various | Component library | Sidebar, Avatar, Select, DropdownMenu, Popover, etc. |
| react-leaflet | ^5.0.0-rc.2 | Map rendering | Requires SSR workaround |
| leaflet | ^1.9.4 | Map engine | CSS imported in root layout |
| next-cloudinary | ^6.16.0 | Image upload | CldUploadWidget |
| prisma | ^6.3.1 | ORM | FindingWithRelations type |
| next-auth | ^4.24.11 | Authentication | Session for user data |
| date-fns | ^3.6.0 | Date utilities | Already installed, use for date range filters |
| lucide-react | ^0.475.0 | Icons | Already used throughout |
| react-day-picker | ^9.6.2 | Date picker | Already installed, use for date range filter |

### Supporting (no new installs needed)
| Library | Purpose | When to Use |
|---------|---------|-------------|
| nuqs | URL query param state management | For filter persistence in URL |

**Note on nuqs:** The project does not currently have a URL search params library. For filter persistence, there are two approaches: (1) use `useSearchParams` + `useRouter` from Next.js directly (zero dependencies), or (2) install `nuqs` which provides type-safe URL state with React state-like API. Given the number of filters (tags, date range, location, status, search, sort), `nuqs` simplifies the code significantly. However, raw Next.js APIs work fine and avoid a new dependency.

**Recommendation:** Use Next.js built-in `useSearchParams` + `useRouter().replace()` to avoid adding dependencies. The filter count is manageable (6 params).

### No New Dependencies Needed
This phase can be completed entirely with existing dependencies. The only exception is that zustand is mentioned in the context but is NOT actually installed (grep found zero code references). The "zustand deprecated export" warning may come from a transitive dependency or was already fixed. Verify at implementation time.

## Architecture Patterns

### Current Layout Structure
```
app/layout.tsx              -- Root: imports leaflet CSS, wraps AuthProvider
app/dashboard/layout.tsx    -- Dashboard: SidebarProvider > AppSidebar + SidebarInset
                               SidebarInset contains: header (SidebarTrigger + Breadcrumbs) + children
```

### New Layout Structure (for header bar)
```
app/dashboard/layout.tsx should become:

<div className="flex flex-col h-screen">
  <!-- Full-width black header bar (60px, z-50, above sidebar) -->
  <AppHeaderBar />

  <SidebarProvider>
    <AppSidebar />           <!-- No longer contains SidebarTrigger -->
    <SidebarInset>
      {children}
    </SidebarInset>
  </SidebarProvider>
</div>
```

**Key insight:** The header must sit OUTSIDE and ABOVE the `SidebarProvider` to span full viewport width, including over the sidebar area. The `SidebarTrigger` must be moved into the sidebar itself (bottom, above NavUser).

### Pattern 1: react-leaflet SSR Fix
**What:** react-leaflet components (MapContainer, TileLayer, Marker) depend on browser APIs (window, document) and crash during Next.js server-side rendering. React error #130 means a component resolved to `undefined` during render.
**When to use:** Every component that imports from `react-leaflet` or `leaflet`.
**Solution:** Use `next/dynamic` with `ssr: false` to lazy-load map components.
```typescript
// In a parent component or wrapper:
import dynamic from "next/dynamic";

const FindingMap = dynamic(
  () => import("./_components/FindingMap"),
  { ssr: false, loading: () => <div className="h-full animate-pulse bg-muted" /> }
);
```
**Affected files:**
- `app/dashboard/findings/map/page.tsx` -- imports FindingMap directly
- `app/dashboard/findings/_components/FindingDetail.tsx` -- likely imports map
- `components/ui/input/location-picker/location-picker.tsx` -- imports map
- `components/ui/input/location-picker/location-modal.tsx` -- imports map
- Any new mini-map usage on the Funde dashboard page

**Important:** The component file itself (`FindingMap.tsx`, `simple-map.tsx`) can keep `"use client"` and direct leaflet imports. Only the IMPORT SITE needs `next/dynamic`.

### Pattern 2: NavMain Click-to-Navigate + Expand
**What:** Currently `CollapsibleTrigger` wraps the `SidebarMenuButton`, making clicks only toggle the collapsible. Need clicks to BOTH navigate to the parent URL AND expand the submenu.
**Solution:** Replace `CollapsibleTrigger asChild` wrapping the button. Instead, make the button an `<a>` link to the parent URL and programmatically toggle the collapsible open state.
```typescript
// Option: Use Link for navigation + onClick to toggle collapsible
import Link from "next/link";
import { useState } from "react";

// Each nav item needs a real URL (not "#"):
// "Funde" -> "/dashboard/findings"
// "Tags" -> "/dashboard/tags"
// "Kategorien" -> "/dashboard/tags/categories"
// "User" -> "/dashboard/image-gallery"

<Collapsible open={isOpen} onOpenChange={setIsOpen}>
  <SidebarMenuItem>
    <SidebarMenuButton asChild tooltip={item.title} onClick={() => setIsOpen(!isOpen)}>
      <Link href={item.url}>
        {item.icon && <item.icon />}
        <span>{item.title}</span>
        <ChevronRight className="..." />
      </Link>
    </SidebarMenuButton>
    <CollapsibleContent>
      {/* sub items */}
    </CollapsibleContent>
  </SidebarMenuItem>
</Collapsible>
```

### Pattern 3: URL-Persisted Filters
**What:** Filters (tags, date range, location, status, search, sort) stored in URL query params.
**Implementation:**
```typescript
"use client";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

function useFilterParams() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const filters = {
    search: searchParams.get("q") || "",
    sort: searchParams.get("sort") || "newest",
    tags: searchParams.getAll("tag"),
    dateFrom: searchParams.get("dateFrom") || "",
    dateTo: searchParams.get("dateTo") || "",
    status: searchParams.get("status") || "",
    // location radius would need lat, lng, radius params
  };

  const setFilter = (key: string, value: string | string[]) => {
    const params = new URLSearchParams(searchParams.toString());
    if (Array.isArray(value)) {
      params.delete(key);
      value.forEach(v => params.append(key, v));
    } else if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.replace(`${pathname}?${params.toString()}`);
  };

  return { filters, setFilter };
}
```

### Pattern 4: German Breadcrumb Label Map
**What:** URL path segments need German translation for the header bar.
```typescript
const SEGMENT_LABELS: Record<string, string> = {
  "findings": "Funde",
  "new": "Neuer Fund",
  "map": "Karte",
  "image-gallery": "Foto-Gallerie",
  "tags": "Tags",
  "categories": "Kategorien",
  "settings": "Einstellungen",
};
```
For dynamic segments like `/dashboard/findings/[id]`, fetch the finding name. This requires either:
- A lightweight API call from the breadcrumb component
- Passing the finding name through a context/store from the page that already fetched it

**Recommendation:** Use a React context that pages can populate with entity names, keeping the breadcrumb component generic.

### Pattern 5: User Initials from Session
```typescript
function getInitials(name: string | null | undefined): string {
  if (!name) return "??";
  return name
    .split(" ")
    .map(part => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
```

### Anti-Patterns to Avoid
- **Importing react-leaflet at module level in server-rendered components:** Always use `next/dynamic` with `ssr: false` at the import site.
- **Using `<a>` tags instead of Next.js `<Link>` for internal navigation:** Causes full page reloads. The current NavMain uses `<a href={subItem.url}>` -- these should be `<Link>`.
- **Hardcoding user data in component files:** The current `AppSidebar.tsx` has a `data` object with hardcoded user info (line 18-28). This must be replaced with session data.
- **Using `useCallback` without calling the result:** The current `FindingFilters.tsx` line 23 creates a callback with `useCallback` but never calls it -- the filters never actually propagate. This is a bug: it should be `useEffect`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Date range picker | Custom date inputs | shadcn/ui DatePicker + react-day-picker (already installed) | Calendar UX, locale handling |
| Collapsible sidebar | Custom toggle logic | shadcn/ui Sidebar's built-in `collapsible="icon"` | Already implemented, handles animations |
| Dropdown menus | Custom dropdown | Radix DropdownMenu (already used) | Accessibility, keyboard nav |
| Breadcrumb UI | Custom dividers/links | shadcn/ui Breadcrumb components (already used) | Consistent styling |
| Tag multi-select | Custom multi-select | cmdk (already installed) + Popover for combobox | Search, keyboard nav, accessibility |
| Avatar fallback | Custom image fallback | Radix Avatar with AvatarFallback (already used) | Handles loading states |

## Common Pitfalls

### Pitfall 1: react-leaflet SSR Crash (React Error #130)
**What goes wrong:** Importing `MapContainer`, `TileLayer`, or `Marker` in a component that gets server-rendered causes `undefined` component type error because leaflet requires `window`.
**Why it happens:** Next.js App Router renders components on the server by default. Even `"use client"` components get SSR'd on first load.
**How to avoid:** Wrap ALL map component imports with `next/dynamic({ ssr: false })`. The `"use client"` directive alone is NOT sufficient.
**Warning signs:** Error #130, "window is not defined", blank map area, 500 errors on map routes.
**Current affected files:** `FindingMap.tsx` and `simple-map.tsx` are imported directly without dynamic imports in `map/page.tsx`, `FindingDetail.tsx`, `location-picker.tsx`, and `location-modal.tsx`.

### Pitfall 2: FindingFilters useCallback Bug
**What goes wrong:** Filters never propagate to the findings list.
**Why it happens:** `FindingFilters.tsx` line 23 uses `useCallback` instead of `useEffect`. `useCallback` returns a memoized function but never executes it. The `onChange` callback is never called.
**How to avoid:** Replace with `useEffect` that calls `onChange` when debounced values change.
```typescript
// WRONG (current code):
useCallback(() => {
  onChange({ search: debouncedSearch, sort });
}, [debouncedSearch, onChange, sort]);

// CORRECT:
useEffect(() => {
  onChange({ search: debouncedSearch, sort });
}, [debouncedSearch, sort]); // Note: onChange excluded to avoid infinite loops
```

### Pitfall 3: Header Bar Z-Index and Layout
**What goes wrong:** Header doesn't actually overlay the sidebar, or sidebar content shifts.
**Why it happens:** The `SidebarProvider` manages its own layout context. Putting the header inside `SidebarInset` means it only covers the content area.
**How to avoid:** Place the header bar OUTSIDE `SidebarProvider` entirely, at the top of the flex column. Use `z-50` to ensure it sits above the sidebar. The sidebar's top must account for the 60px header (e.g., `top-[60px] h-[calc(100vh-60px)]`).

### Pitfall 4: Cloudinary Upload Preset
**What goes wrong:** 400 error when uploading images.
**Why it happens:** The preset name `"detektor-hud-preset"` in `ImageGallery.tsx` doesn't match what's configured in the Cloudinary dashboard. Likely a typo ("hud" vs "hub") or the preset was never created.
**How to avoid:** This is a Cloudinary dashboard configuration issue, not a code issue. The fix is to either: (a) create the preset in Cloudinary dashboard matching `"detektor-hud-preset"`, or (b) rename the preset in code to match an existing one. The preset must be set to "unsigned" mode for client-side uploads.
**Implementation:** Check `.env` files for Cloudinary config, verify the preset name matches the dashboard.

### Pitfall 5: SidebarTrigger Outside SidebarProvider
**What goes wrong:** Moving `SidebarTrigger` requires it to remain inside the `SidebarProvider` context, since it calls `useSidebar()`.
**Why it happens:** `SidebarTrigger` uses the `useSidebar` hook which requires `SidebarProvider` ancestor.
**How to avoid:** The sidebar trigger MUST stay within `SidebarProvider`. Place it inside the sidebar component itself (at the bottom, above NavUser) as specified in the decisions.

### Pitfall 6: useFindings Infinite Re-render
**What goes wrong:** The `useFindings` hook uses `params` object in the `useEffect` dependency array. If the parent creates a new object on every render, the effect runs infinitely.
**Why it happens:** Object reference comparison in dependency array.
**How to avoid:** The current `FindingMap.tsx` correctly uses `useMemo` for the params object. Ensure any new usage of `useFindings` also memoizes params.

### Pitfall 7: Missing "Determination Score" System
**What goes wrong:** The CONTEXT mentions stat cards for "unidentified count" tied to "the existing Determination Score system."
**Why it happens:** No determination score field or system exists in the codebase. The `Finding` model has a `status` enum (DRAFT/COMPLETED) but nothing about identification/determination.
**How to avoid:** For the stat cards, use the existing `FindingStatus` (DRAFT vs COMPLETED) as the closest proxy for "identified" status. Or simply count findings by status. Don't try to implement a determination score system in this phase.

## Code Examples

### Dynamic Import for Map (SSR Fix)
```typescript
// In map/page.tsx or any page using a map component:
import dynamic from "next/dynamic";

const FindingMap = dynamic(
  () => import("../_components/FindingMap"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-muted animate-pulse rounded-lg" />
    ),
  }
);
```

### AppSidebar with Session Data
```typescript
"use client";
import { useSession } from "next-auth/react";

export function AppSidebar({ ...props }) {
  const { data: session } = useSession();

  const teams = [{
    name: session?.user?.name
      ? `${session.user.name.split(" ")[0]} Team`
      : "Mein Team",
    logo: GalleryVerticalEnd,
    plan: "Starter Plan",
  }];

  // NavUser no longer needs hardcoded data:
  const user = {
    name: session?.user?.name || "Benutzer",
    email: session?.user?.email || "",
    avatar: session?.user?.image || "",
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        <SidebarTrigger className="..." />  {/* Moved here */}
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
```

### Full-Width Header Bar Component
```typescript
"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";

const LABELS: Record<string, string> = {
  findings: "Funde",
  new: "Neuer Fund",
  map: "Karte",
  "image-gallery": "Foto-Gallerie",
  tags: "Tags",
  categories: "Kategorien",
};

export function AppHeaderBar() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean).filter(s => s !== "dashboard");

  return (
    <header className="h-[60px] w-full bg-black text-white flex items-center px-6 z-50 shrink-0">
      <div className="flex items-center gap-2 text-[clamp(1.5rem,4vw,2.5rem)] font-bold tracking-tight">
        <Link href="/dashboard" className="hover:text-gray-300">
          Detektor Hub
        </Link>
        {segments.map((segment, i) => {
          const href = "/dashboard/" + segments.slice(0, i + 1).join("/");
          const label = LABELS[segment] || segment;
          const isLast = i === segments.length - 1;
          return (
            <span key={i} className="flex items-center gap-2">
              <span className="text-gray-500">&gt;</span>
              {isLast ? (
                <span>{label}</span>
              ) : (
                <Link href={href} className="hover:text-gray-300">{label}</Link>
              )}
            </span>
          );
        })}
      </div>
    </header>
  );
}
```
**Note on font size:** 72px is extremely large for a header. At `clamp(1.5rem, 4vw, 2.5rem)` it stays readable across viewports. The implementer should match the user's design intent -- if they truly want 72px, use it but expect text overflow on mobile. Consider responsive scaling.

### Restructured navMain Data
```typescript
const navMain = [
  {
    title: "Funde",
    url: "/dashboard/findings",  // Now a real URL, not "#"
    icon: LocateIcon,
    items: [
      { title: "Neuer Fund", url: "/dashboard/findings/new" },
      // "Alle Funde" REMOVED
      { title: "Karte", url: "/dashboard/findings/map" },
    ],
  },
  {
    title: "Tags",
    url: "/dashboard/tags",
    icon: Tag,
    items: [
      { title: "Tags", url: "/dashboard/tags" },
      // "Kategorien" REMOVED from here
    ],
  },
  {
    title: "Kategorien",           // NEW top-level entry
    url: "/dashboard/tags/categories",
    icon: LayoutGrid,              // Or similar icon
    items: [],                     // No sub-items
  },
  {
    title: "User",
    url: "/dashboard/image-gallery",
    icon: User,
    items: [
      { title: "Foto-Gallerie", url: "/dashboard/image-gallery" },
    ],
  },
];
```

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| react-leaflet direct import | `next/dynamic({ ssr: false })` wrapper | Required for Next.js App Router SSR |
| `<a href>` for client nav | `<Link href>` from next/link | Prevents full page reloads |
| Hardcoded user data in sidebar | Session-driven via `useSession()` | Already partially done in NavUser |
| Filter state in React state only | URL search params | Shareable, survives refresh |

## Data Model Observations

### Finding Model (for filters/stats)
- `status`: `DRAFT` | `COMPLETED` -- use as proxy for "identified" vs "unidentified"
- `foundAt`: DateTime -- use for date range filters
- `latitude`/`longitude`: Float -- use for location radius filter and mini map
- `tags`: Many-to-many relation -- use for tag filter
- No `reported` field exists -- the "reported/unreported" filter from CONTEXT has no backing field. Either skip or add a boolean field.

### API Filtering
The existing `/api/findings` route supports: `q` (search), `tag`, `page`, `pageSize`, `orderBy`, `order`. It will need extension for: `status`, `dateFrom`, `dateTo`, `locationLat`, `locationLng`, `locationRadius`. Multiple tag filtering (currently only single tag via `tag` param).

## Open Questions

1. **Determination Score / "Identified" Status**
   - What we know: CONTEXT mentions "unidentified count" stat card tied to "Determination Score system"
   - What's unclear: No such system exists in the codebase. Only `FindingStatus` enum (DRAFT/COMPLETED).
   - Recommendation: Use DRAFT=unidentified, COMPLETED=identified as the proxy. Don't build a new determination system in this phase.

2. **"Reported" Status**
   - What we know: CONTEXT asks for reported/unreported filter
   - What's unclear: No `reported` field on the Finding model
   - Recommendation: Either add a `reported Boolean @default(false)` field to the schema (small migration) or defer this specific filter if it's not critical for phase 1.

3. **Location Radius Filter**
   - What we know: Users want to filter by location radius
   - What's unclear: PostGIS is configured (from git history), but whether spatial queries are available via Prisma
   - Recommendation: Use a bounding box approach (filter by lat/lng range) rather than true radius -- simpler, no PostGIS dependency in Prisma queries. Or use raw SQL with ST_DWithin if PostGIS is set up.

4. **Cloudinary Preset Name**
   - What we know: Code uses `"detektor-hud-preset"`, which returns 400
   - What's unclear: Whether this is a typo ("hud" vs "hub") or the preset was never created
   - Recommendation: Check the Cloudinary dashboard. If no preset exists, create one named `"detektor-hub-preset"` (correcting the typo) and update the code reference.

5. **72px Font Size in Header**
   - What we know: User specified ~72px font in the header bar within a 60px tall header
   - What's unclear: 72px text cannot fit in a 60px container without overflow. Likely the user wants a prominent, large font -- perhaps 60px header height is flexible, or 72px is the visual weight intent rather than literal CSS value.
   - Recommendation: Use a large font that fits the header (e.g., 36-40px in a 60px header) and verify with user if the visual weight matches their expectation.

## Sources

### Primary (HIGH confidence)
- Codebase analysis: All source files read directly from project
- Next.js dynamic imports: Well-documented pattern for SSR-incompatible libraries
- react-leaflet SSR issue: Universal known issue, documented in react-leaflet GitHub

### Secondary (MEDIUM confidence)
- shadcn/ui Sidebar: Pattern inferred from existing codebase usage (SidebarProvider, SidebarTrigger, useSidebar)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already in package.json, versions confirmed
- Architecture: HIGH - layout structure read directly from source
- Bug fixes: HIGH - root causes identified from code inspection (missing dynamic imports, hardcoded data, useCallback bug)
- Filter system: MEDIUM - API extension pattern clear, but location radius and "reported" status need schema decisions
- Pitfalls: HIGH - based on direct code inspection

**Research date:** 2026-03-07
**Valid until:** 2026-04-07 (stable stack, no fast-moving dependencies)
