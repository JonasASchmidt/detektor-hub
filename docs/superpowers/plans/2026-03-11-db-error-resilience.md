# Database & Error Resilience Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add missing database indexes, error boundaries, input validation on high-risk routes, and a `.env.example` file.

**Architecture:** DB indexes via Prisma schema + Supabase MCP migration (not `prisma migrate dev`). Error boundaries as minimal `error.tsx` files with German copy. Zod validation follows the existing `safeParse` pattern from `app/api/findings/route.ts`.

**Tech Stack:** Next.js 16 App Router, Prisma, Zod, Supabase MCP

**Important:** Migrations are applied via Supabase MCP (`supabase__apply_migration`), NOT `npx prisma migrate dev`. After schema changes, run `npx prisma generate`.

---

## Chunk 1: Database Indexes

### Task 1: Add indexes to Prisma schema

**Files:**
- Modify: `prisma/schema.prisma`

Missing indexes on foreign-key columns that appear in WHERE clauses cause full table scans. None of these require data changes — they are additive and safe.

- [ ] **Step 1: Add `@@index` to `Finding` model**

In `prisma/schema.prisma`, find the `Finding` model. Add the following before the closing `}`:
```prisma
  @@index([userId])
  @@index([status])
```

The end of the Finding model should look like:
```prisma
  Finding_A         Finding[]     @relation("RelatedFindings")
  Finding_B         Finding[]     @relation("RelatedFindings")
  @@index([userId])
  @@index([status])
}
```

- [ ] **Step 2: Add `@@index` to `Image` model**

In the `Image` model, add before the closing `}`:
```prisma
  @@index([userId])
  @@index([findingId])
```

- [ ] **Step 3: Add `@@index` to `Notification` model**

In the `Notification` model, add before the closing `}`:
```prisma
  @@index([recipientId])
  @@index([isRead])
```

- [ ] **Step 4: Add `@@index` to `Comment` model**

In the `Comment` model, add before the closing `}`:
```prisma
  @@index([findingId])
  @@index([userId])
```

- [ ] **Step 5: Validate schema**

```bash
npx prisma validate
```
Expected: "The schema at prisma/schema.prisma is valid!"

- [ ] **Step 6: Generate migration SQL**

```bash
npx prisma migrate diff \
  --from-schema-datasource prisma/schema.prisma \
  --to-schema-datamodel prisma/schema.prisma \
  --script
```

Actually, generate a migration preview:
```bash
npx prisma migrate dev --name add-performance-indexes --create-only
```
This creates a migration file without applying it.

- [ ] **Step 7: Apply migration via Supabase MCP**

Use the `supabase__apply_migration` MCP tool with the SQL from the generated migration file in `prisma/migrations/`.

The SQL will contain `CREATE INDEX` statements like:
```sql
CREATE INDEX "Finding_userId_idx" ON "Finding"("userId");
CREATE INDEX "Finding_status_idx" ON "Finding"("status");
CREATE INDEX "Image_userId_idx" ON "Image"("userId");
CREATE INDEX "Image_findingId_idx" ON "Image"("findingId");
CREATE INDEX "Notification_recipientId_idx" ON "Notification"("recipientId");
CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead");
CREATE INDEX "Comment_findingId_idx" ON "Comment"("findingId");
CREATE INDEX "Comment_userId_idx" ON "Comment"("userId");
```

- [ ] **Step 8: Regenerate Prisma client**

```bash
npx prisma generate
```

- [ ] **Step 9: Verify build**

```bash
npm run build 2>&1 | tail -20
```

- [ ] **Step 10: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "perf: add database indexes for userId, status, findingId, recipientId"
```

---

## Chunk 2: Error Boundaries

### Task 2: Add error boundaries for the dashboard

**Files:**
- Create: `app/dashboard/error.tsx`
- Create: `app/dashboard/findings/error.tsx`

Next.js App Router uses `error.tsx` files as React error boundaries. They must be Client Components.

- [ ] **Step 1: Create `app/dashboard/error.tsx`**

```tsx
"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 p-6">
      <h2 className="text-lg font-semibold">Etwas ist schiefgelaufen.</h2>
      <p className="text-sm text-muted-foreground text-center max-w-sm">
        Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es erneut.
      </p>
      <Button onClick={reset} variant="outline">
        Erneut versuchen
      </Button>
    </div>
  );
}
```

- [ ] **Step 2: Create `app/dashboard/findings/error.tsx`**

```tsx
"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function FindingsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 p-6">
      <h2 className="text-lg font-semibold">Fehler beim Laden der Funde.</h2>
      <p className="text-sm text-muted-foreground text-center max-w-sm">
        Die Funde konnten nicht geladen werden. Bitte versuche es erneut.
      </p>
      <Button onClick={reset} variant="outline">
        Erneut versuchen
      </Button>
    </div>
  );
}
```

- [ ] **Step 3: Verify build**

```bash
npm run build 2>&1 | tail -20
```

- [ ] **Step 4: Commit**

```bash
git add app/dashboard/error.tsx app/dashboard/findings/error.tsx
git commit -m "feat: add error boundaries for dashboard and findings routes"
```

---

## Chunk 3: Input Validation & Env Example

### Task 3: Add Zod validation to tag and category creation

**Files:**
- Modify: `app/api/tags/route.ts`
- Modify: `app/api/tag-categories/route.ts`

Add a Zod schema inline (no need for a separate schema file — these are simple).

- [ ] **Step 1: Add Zod schema and validation to `app/api/tags/route.ts`**

After the existing imports, add:
```ts
import { z } from "zod";

const tagSchema = z.object({
  name: z.string().min(1, "Der Name des Tags ist erforderlich.").max(100),
  color: z.string().min(1, "Die Auswahl einer Farbe ist erforderlich."),
  icon: z.string().min(1, "Die Auswahl eines Icons ist erforderlich."),
  category: z.string().uuid("Ungültige Kategorie-ID."),
});
```

In the `POST` handler, replace the manual `if (!name)` / `if (!color)` / `if (!icon)` checks with:
```ts
const body = await req.json();
const parsed = tagSchema.safeParse(body);
if (!parsed.success) {
  return NextResponse.json(
    { error: parsed.error.errors[0].message },
    { status: 400 }
  );
}
const { category, name, color, icon } = parsed.data;
```

Do the same replacement in the `PUT` handler (add `id: z.string().uuid()` to the schema for PUT, or use a separate `tagUpdateSchema`):
```ts
const tagUpdateSchema = tagSchema.extend({ id: z.string().uuid() });

const body = await req.json();
const parsed = tagUpdateSchema.safeParse(body);
if (!parsed.success) {
  return NextResponse.json(
    { error: parsed.error.errors[0].message },
    { status: 400 }
  );
}
const { category, name, color, icon, id } = parsed.data;
```

- [ ] **Step 2: Add Zod validation to `app/api/tag-categories/route.ts`**

After existing imports:
```ts
import { z } from "zod";

const categorySchema = z.object({
  name: z.string().min(1, "Der Name der Kategorie ist erforderlich.").max(100),
});
```

In the `POST` handler, replace `const { name } = await req.json()` and the `if (!name)` check with:
```ts
const body = await req.json();
const parsed = categorySchema.safeParse(body);
if (!parsed.success) {
  return NextResponse.json(
    { error: parsed.error.errors[0].message },
    { status: 400 }
  );
}
const { name } = parsed.data;
```

Remove the now-redundant manual `if (!name)` block.

- [ ] **Step 3: Verify build**

```bash
npm run build 2>&1 | tail -20
```

- [ ] **Step 4: Commit**

```bash
git add app/api/tags/route.ts app/api/tag-categories/route.ts
git commit -m "feat: add Zod input validation to tag and category routes"
```

---

### Task 4: Add `.env.example`

**Files:**
- Create: `.env.example`

- [ ] **Step 1: Create `.env.example`**

```bash
# Database
POSTGRES_PRISMA_URL=          # Pooled connection string (e.g. from Supabase)
POSTGRES_URL_NON_POOLING=     # Direct connection string (used for migrations)

# Auth
NEXTAUTH_SECRET=              # Random secret (generate with: openssl rand -base64 32)
NEXTAUTH_URL=                 # e.g. http://localhost:3000

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Analytics (optional)
NEXT_PUBLIC_CLARITY_PROJECT_ID=   # Microsoft Clarity project ID
```

- [ ] **Step 2: Verify `.env.example` is not gitignored (it should NOT be)**

```bash
git check-ignore -v .env.example
```
Expected: no output (file is tracked).

- [ ] **Step 3: Commit**

```bash
git add .env.example
git commit -m "docs: add .env.example with all required environment variables"
```
