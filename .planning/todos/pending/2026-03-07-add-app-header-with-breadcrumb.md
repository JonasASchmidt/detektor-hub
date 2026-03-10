---
created: 2026-03-07T19:42:57.462Z
title: Add app header with breadcrumb
area: ui
files: []
---

## Problem

The app currently lacks a header component with breadcrumb navigation. Users need visual context of where they are within the dashboard hierarchy (e.g., Dashboard > Foto-Gallerie).

## Solution

Add a header component to the dashboard layout that includes breadcrumb navigation based on the current route. Should integrate with the existing sidebar navigation structure in `components/AppSidebar.tsx`.
