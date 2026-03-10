---
created: 2026-03-07T19:42:57.462Z
title: Fix Cloudinary image upload preset not found
area: api
files: []
---

## Problem

Image uploads fail with Cloudinary returning 400 (Bad Request). The error message is: `Upload preset not found`. Multiple upload attempts to `https://api.cloudinary.com/v1_1/dinupnqcx/upload` all fail with the same error.

This means the Cloudinary upload preset configured in the app either doesn't exist in the Cloudinary account or is misconfigured.

## Solution

1. Check the Cloudinary dashboard for cloud name `dinupnqcx` and verify/create the required upload preset
2. Find the upload preset name used in the codebase and ensure it matches what's configured in Cloudinary
3. Ensure the preset is set to "unsigned" if using client-side uploads, or configure proper signing for server-side uploads
4. Verify the `CLOUDINARY_API_KEY` and related env vars are correctly set in Vercel
