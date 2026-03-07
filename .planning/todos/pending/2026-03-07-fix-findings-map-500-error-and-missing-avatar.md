---
created: 2026-03-07T19:42:57.462Z
title: Fix findings map 500 error and missing avatar
area: ui
files: []
---

## Problem

Multiple errors on the deployed Vercel app:

1. **Map page 500 error**: `GET /dashboard/findings/map` returns 500 (Internal Server Error). Also triggers React error #130 (component type is undefined — likely a bad import or missing component).
2. **Missing avatar**: `GET /avatars/shadcn.jpg` returns 404 — placeholder avatar image doesn't exist.
3. **Deprecated zustand import**: Console warning about default export being deprecated, should use `import { create } from 'zustand'`.

## Solution

1. Debug the map page server-side error (check Vercel logs, investigate the React #130 error — likely an undefined component being rendered)
2. Fix or remove the shadcn.jpg avatar reference
3. Update zustand import to use named export
