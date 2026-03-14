-- =============================================================================
-- SECTION 1: Backfill schema drift (objects created via `db push`, not tracked
-- in migration history). All statements use IF NOT EXISTS / DO blocks so they
-- are no-ops on the real database but build up the shadow database correctly.
-- =============================================================================

-- FieldSession table (was never in a migration)
CREATE TABLE IF NOT EXISTS "FieldSession" (
    "id"          TEXT         NOT NULL,
    "name"        TEXT         NOT NULL,
    "description" TEXT,
    "dateFrom"    TIMESTAMP(3) NOT NULL,
    "dateTo"      TIMESTAMP(3),
    "detectorId"  TEXT,
    "userId"      TEXT         NOT NULL,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FieldSession_pkey" PRIMARY KEY ("id")
);

-- FieldSession FKs
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'FieldSession_detectorId_fkey'
  ) THEN
    ALTER TABLE "FieldSession"
      ADD CONSTRAINT "FieldSession_detectorId_fkey"
      FOREIGN KEY ("detectorId") REFERENCES "Detector"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'FieldSession_userId_fkey'
  ) THEN
    ALTER TABLE "FieldSession"
      ADD CONSTRAINT "FieldSession_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

-- PostGIS geometry column on FieldSession (was added via db push; needed in shadow
-- DB so the subsequent DROP COLUMN IF EXISTS succeeds gracefully)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'FieldSession' AND column_name = 'zone'
  ) THEN
    ALTER TABLE "FieldSession" ADD COLUMN "zone" geometry(Polygon,4326);
  END IF;
END $$;

-- Finding: missing columns from db push
ALTER TABLE "Finding" ADD COLUMN IF NOT EXISTS "reported" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Finding" ADD COLUMN IF NOT EXISTS "fieldSessionId" TEXT;

-- Finding → FieldSession FK
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Finding_fieldSessionId_fkey'
  ) THEN
    ALTER TABLE "Finding"
      ADD CONSTRAINT "Finding_fieldSessionId_fkey"
      FOREIGN KEY ("fieldSessionId") REFERENCES "FieldSession"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Comment: missing columns from db push
ALTER TABLE "Comment" ADD COLUMN IF NOT EXISTS "parentId"  TEXT;
ALTER TABLE "Comment" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Comment" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Comment self-relation FK
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Comment_parentId_fkey'
  ) THEN
    ALTER TABLE "Comment"
      ADD CONSTRAINT "Comment_parentId_fkey"
      FOREIGN KEY ("parentId") REFERENCES "Comment"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Image: missing columns from db push
ALTER TABLE "Image" ADD COLUMN IF NOT EXISTS "commentId" TEXT;
ALTER TABLE "Image" ADD COLUMN IF NOT EXISTS "folder"    TEXT NOT NULL DEFAULT 'All';

-- Image → Comment FK
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Image_commentId_fkey'
  ) THEN
    ALTER TABLE "Image"
      ADD CONSTRAINT "Image_commentId_fkey"
      FOREIGN KEY ("commentId") REFERENCES "Comment"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Notification enum and table (were never in a migration)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'NotificationType') THEN
    CREATE TYPE "NotificationType" AS ENUM ('MENTION', 'REPLY', 'FINDING_COMMENT');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "Notification" (
    "id"          TEXT               NOT NULL,
    "type"        "NotificationType" NOT NULL,
    "recipientId" TEXT               NOT NULL,
    "actorId"     TEXT,
    "findingId"   TEXT,
    "commentId"   TEXT,
    "isRead"      BOOLEAN            NOT NULL DEFAULT false,
    "createdAt"   TIMESTAMP(3)       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Notification_recipientId_fkey'
  ) THEN
    ALTER TABLE "Notification"
      ADD CONSTRAINT "Notification_recipientId_fkey"
      FOREIGN KEY ("recipientId") REFERENCES "User"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Notification_actorId_fkey'
  ) THEN
    ALTER TABLE "Notification"
      ADD CONSTRAINT "Notification_actorId_fkey"
      FOREIGN KEY ("actorId") REFERENCES "User"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;


-- =============================================================================
-- SECTION 2: Zone feature — the actual new migration
-- =============================================================================

-- CreateTable: Zone
CREATE TABLE IF NOT EXISTS "Zone" (
    "id"          TEXT         NOT NULL,
    "name"        TEXT         NOT NULL,
    "description" TEXT,
    "userId"      TEXT         NOT NULL,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Zone_pkey" PRIMARY KEY ("id")
);

-- Add PostGIS geometry column to Zone (Unsupported type — raw SQL required)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Zone' AND column_name = 'geometry'
  ) THEN
    ALTER TABLE "Zone" ADD COLUMN "geometry" geometry(Polygon,4326);
  END IF;
END $$;

-- Zone → User FK
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Zone_userId_fkey'
  ) THEN
    ALTER TABLE "Zone"
      ADD CONSTRAINT "Zone_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

-- Add zoneId FK column to FieldSession
ALTER TABLE "FieldSession" ADD COLUMN IF NOT EXISTS "zoneId" TEXT;

-- Data migration: lift existing inline zone polygons into named Zone entities
DO $$
DECLARE
    rec    RECORD;
    new_id TEXT;
BEGIN
    FOR rec IN
        SELECT id, name, "userId", zone
        FROM "FieldSession"
        WHERE zone IS NOT NULL
    LOOP
        new_id := gen_random_uuid()::text;
        INSERT INTO "Zone" (id, name, "userId", geometry, "createdAt", "updatedAt")
        VALUES (
            new_id,
            'Zone (' || rec.name || ')',
            rec."userId",
            rec.zone,
            NOW(),
            NOW()
        );
        UPDATE "FieldSession" SET "zoneId" = new_id WHERE id = rec.id;
    END LOOP;
END $$;

-- Drop old inline geometry column from FieldSession
ALTER TABLE "FieldSession" DROP COLUMN IF EXISTS "zone";

-- FieldSession → Zone FK
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'FieldSession_zoneId_fkey'
  ) THEN
    ALTER TABLE "FieldSession"
      ADD CONSTRAINT "FieldSession_zoneId_fkey"
      FOREIGN KEY ("zoneId") REFERENCES "Zone"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
