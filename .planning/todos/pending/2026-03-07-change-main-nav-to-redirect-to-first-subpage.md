---
created: 2026-03-07T19:42:57.462Z
title: Change main nav to redirect to first subpage
area: ui
files:
  - components/AppSidebar.tsx
---

## Problem

Clicking a main navigation entry (top-level group) in the sidebar doesn't navigate anywhere meaningful. Users expect clicking a main nav item to either show its own page or redirect to the first subpage.

## Solution

Update sidebar navigation behavior so that clicking a main nav entry either:
- Redirects to the first child/subpage URL, or
- Has its own dedicated landing page

Decision on which approach depends on UX preference. Redirect to first subpage is likely simpler.
