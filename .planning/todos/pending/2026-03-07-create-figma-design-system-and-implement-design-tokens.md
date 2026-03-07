---
created: 2026-03-07T19:42:57.462Z
title: Create Figma design system and implement design tokens
area: ui
files: []
---

## Problem

The codebase lacks a formal design system. Design tokens (colors, spacing, typography, etc.) are not extracted or standardized, and there is no Figma design system file to serve as the single source of truth for the UI.

## Solution

1. Extract existing design tokens from the codebase (colors, spacing, typography, shadows, etc.)
2. Run a Figma design system audit using the Claude/Figma MCP plugin
3. Create a Figma design system file with all components and tokens
4. Implement the design system in the codebase so the app consumes Figma design system components
5. Set up Code Connect mappings between Figma components and codebase components for ongoing sync
