---
created: 2026-03-07T19:42:57.462Z
title: Merge Alle Funde into Funde main page with sort and filter
area: ui
files:
  - components/AppSidebar.tsx
---

## Problem

The "Funde" main nav entry and "Alle Funde" subpage are redundant. "Funde" should directly show all finds (currently the content of "Alle Funde"), and "Alle Funde" should be removed as a separate subpage. This simplifies navigation and makes the main "Funde" page the primary view for browsing all finds.

## Solution

1. Move the "Alle Funde" page content to be the "Funde" main page
2. Remove "Alle Funde" as a separate subpage from the sidebar navigation
3. Add extensive sort and filter functionality to the "Funde" main view (sort by date, type, location, etc.; filter by category, status, date range, etc.)
