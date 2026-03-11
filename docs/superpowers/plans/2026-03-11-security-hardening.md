# Security Hardening Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close all authentication/authorization gaps, add missing CRUD handlers for findings, fix pagination DoS vector, and remove debug code.

**Architecture:** Surgical changes only — each fix adds the minimum auth/ownership guard following the existing `getServerSession(authOptions)` + 401 pattern already used in the codebase. No new abstractions.

**Tech Stack:** Next.js 16 App Router, NextAuth v4, Prisma, Zod

---

## Chunk 1: Auth Guards on Tag & Category Routes

### Task 1: Add auth to `/api/tags` POST and PUT

**Files:**
- Modify: `app/api/tags/route.ts`

The POST and PUT handlers have no session check. Add it at the top of each handler, identical to the pattern in `/api/findings/route.ts`.

- [ ] **Step 1: Add auth imports to `app/api/tags/route.ts`**

At the top of the file, after existing imports, add:
```ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
```

- [ ] **Step 2: Add auth guard to POST handler**

Insert at the start of the `POST` function body (before `const { category, name, color, icon } = await req.json()`):
```ts
const session = await getServerSession(authOptions);
if (!session?.user?.id) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

- [ ] **Step 3: Add auth guard to PUT handler**

Insert at the start of the `PUT` function body (before `const { category, name, color, icon, id } = await req.json()`):
```ts
const session = await getServerSession(authOptions);
if (!session?.user?.id) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

- [ ] **Step 4: Verify build**

```bash
npm run build 2>&1 | tail -20
```
Expected: Build completes without errors.

- [ ] **Step 5: Commit**

```bash
git add app/api/tags/route.ts
git commit -m "fix: require auth on tag create/update routes"
```

---

### Task 2: Add auth to `/api/tag-categories` POST and `[id]` DELETE

**Files:**
- Modify: `app/api/tag-categories/route.ts`
- Modify: `app/api/tag-categories/[id]/route.ts`

- [ ] **Step 1: Add auth imports to `app/api/tag-categories/route.ts`**

After existing imports:
```ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
```

- [ ] **Step 2: Add auth guard to POST handler**

Insert at the start of the `POST` function body (before `const { name } = await req.json()`):
```ts
const session = await getServerSession(authOptions);
if (!session?.user?.id) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

- [ ] **Step 3: Add auth imports to `app/api/tag-categories/[id]/route.ts`**

After existing imports:
```ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
```

- [ ] **Step 4: Add auth guard to DELETE handler**

Insert at the start of the `DELETE` function body (before `const { id } = await params`):
```ts
const session = await getServerSession(authOptions);
if (!session?.user?.id) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

- [ ] **Step 5: Verify build**

```bash
npm run build 2>&1 | tail -20
```

- [ ] **Step 6: Commit**

```bash
git add app/api/tag-categories/route.ts "app/api/tag-categories/[id]/route.ts"
git commit -m "fix: require auth on tag-category create/delete routes"
```

---

## Chunk 2: Image Delete — Ownership + Auth + Debug Cleanup

### Task 3: Fix `/api/images/[id]` DELETE

**Files:**
- Modify: `app/api/images/[id]/route.ts`

Three problems in one file: no auth check, no ownership check, and a `console.log` left in.

Current handler signature uses `_: Request` (no session access). Replace the entire handler:

- [ ] **Step 1: Rewrite `app/api/images/[id]/route.ts`**

Replace the full file content with:
```ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import cloudinary from "@/lib/cloudinary";

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existingImage = await prisma.image.findUnique({
    where: { id },
    include: { finding: true },
  });

  if (!existingImage) {
    return NextResponse.json({ error: "Foto nicht gefunden." }, { status: 404 });
  }

  if (existingImage.userId !== session.user.id) {
    return NextResponse.json({ error: "Keine Berechtigung." }, { status: 403 });
  }

  if (existingImage.finding) {
    return NextResponse.json(
      { error: "Foto kann nicht gelöscht werden, da es einem Fund zugeordnet ist." },
      { status: 400 }
    );
  }

  const cldResponse = await cloudinary.uploader.destroy(existingImage.publicId);

  if (cldResponse?.result !== "ok" && cldResponse?.result !== "not found") {
    return NextResponse.json({ error: "Fehler in Cloudinary." }, { status: 500 });
  }

  await prisma.image.delete({ where: { id } });

  return NextResponse.json({ message: "Foto erfolgreich gelöscht." }, { status: 200 });
}
```

Changes made:
- Added `getServerSession(authOptions)` + 401 guard
- Added ownership check (`existingImage.userId !== session.user.id`) + 403
- Removed `console.log({ cldResponse })`
- Changed finding-attached error status from 404 to 400 (correct semantics)
- Changed Cloudinary error status from 404 to 500 (correct semantics)

- [ ] **Step 2: Verify build**

```bash
npm run build 2>&1 | tail -20
```

- [ ] **Step 3: Commit**

```bash
git add "app/api/images/[id]/route.ts"
git commit -m "fix: add auth + ownership check to image delete, remove debug log"
```

---

### Task 4: Fix `getServerSession` in `/api/images/bulk/route.ts`

**Files:**
- Modify: `app/api/images/bulk/route.ts`

Currently uses `getServerSession()` without `authOptions` and then does an extra DB lookup to resolve user by email. Since `authOptions` puts `user.id` in the JWT, we can use it directly.

- [ ] **Step 1: Fix auth in `app/api/images/bulk/route.ts`**

Replace the import and the auth block at the top of the `POST` handler.

Change the import from:
```ts
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";
```
To:
```ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
```

Replace the auth block (lines that call `getServerSession()` and look up user by email) with:
```ts
const session = await getServerSession(authOptions);
if (!session?.user?.id) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
const userId = session.user.id;
```

Then replace all occurrences of `user.id` in the `deleteMany`/`updateMany` where clauses with `userId`.

- [ ] **Step 2: Verify build**

```bash
npm run build 2>&1 | tail -20
```

- [ ] **Step 3: Commit**

```bash
git add app/api/images/bulk/route.ts
git commit -m "fix: use getServerSession(authOptions) in image bulk route"
```

---

## Chunk 3: Findings — Pagination Bounds + PUT + DELETE

### Task 5: Clamp pagination in `/api/findings`

**Files:**
- Modify: `app/api/findings/route.ts`

- [ ] **Step 1: Add pageSize cap in `app/api/findings/route.ts`**

Find the line:
```ts
const pageSize = parseInt(searchParams.get("pageSize") || "20");
```

Replace with:
```ts
const pageSize = Math.min(parseInt(searchParams.get("pageSize") || "20"), 100);
```

- [ ] **Step 2: Commit**

```bash
git add app/api/findings/route.ts
git commit -m "fix: cap pageSize at 100 to prevent DoS"
```

---

### Task 6: Add PUT handler to `/api/findings/[id]/route.ts`

**Files:**
- Modify: `app/api/findings/[id]/route.ts`

Reuse `findingSchemaCompleted` from `@/schemas/finding` (same schema as POST). The handler must:
1. Require auth
2. Load finding and verify ownership
3. Validate body with Zod
4. Update via Prisma

- [ ] **Step 1: Add imports to `app/api/findings/[id]/route.ts`**

Add to the existing imports:
```ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { findingSchemaCompleted } from "@/schemas/finding";
```

- [ ] **Step 2: Add PUT handler**

Append to the file:
```ts
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.finding.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Fund nicht gefunden." }, { status: 404 });
    }
    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Keine Berechtigung." }, { status: 403 });
    }

    const body = await req.json();
    const parsed = findingSchemaCompleted.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { location, tags, images, ...fields } = parsed.data;

    const finding = await prisma.finding.update({
      where: { id },
      data: {
        ...fields,
        latitude: location.lat,
        longitude: location.lng,
        tags: { set: tags.map((tagId) => ({ id: tagId })) },
        images: { set: images.map((imageId) => ({ id: imageId })) },
      },
      include: { tags: true, images: true },
    });

    return NextResponse.json({ finding });
  } catch (error) {
    console.error("Fehler beim Aktualisieren des Funds:", error);
    return NextResponse.json(
      { error: "Fehler beim Aktualisieren des Funds." },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 3: Verify build**

```bash
npm run build 2>&1 | tail -20
```

- [ ] **Step 4: Commit**

```bash
git add "app/api/findings/[id]/route.ts"
git commit -m "feat: add PUT handler for findings with auth and ownership check"
```

---

### Task 7: Add DELETE handler to `/api/findings/[id]/route.ts`

**Files:**
- Modify: `app/api/findings/[id]/route.ts`

- [ ] **Step 1: Add DELETE handler**

Append to the file:
```ts
export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.finding.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Fund nicht gefunden." }, { status: 404 });
    }
    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Keine Berechtigung." }, { status: 403 });
    }

    await prisma.finding.delete({ where: { id } });

    return NextResponse.json({ message: "Fund erfolgreich gelöscht." });
  } catch (error) {
    console.error("Fehler beim Löschen des Funds:", error);
    return NextResponse.json(
      { error: "Fehler beim Löschen des Funds." },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Final build verification**

```bash
npm run build 2>&1 | tail -20
```
Expected: Build completes, no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add "app/api/findings/[id]/route.ts"
git commit -m "feat: add DELETE handler for findings with auth and ownership check"
```
