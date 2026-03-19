import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import { lookupAdminUnits } from "@/lib/geo";
import { applyNamingScheme } from "@/lib/namingScheme";
import { revalidatePath } from "next/cache";

const importFindingSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  name: z.string().optional(),
  description: z.string().optional(),
  /** ISO 8601 string */
  foundAt: z.string().datetime().optional(),
  depth: z.number().nonnegative().optional(),
  conductivity: z.number().int().nonnegative().optional(),
  fieldSessionId: z.string().optional(),
  /** Cloudinary image ID — already uploaded before calling this endpoint */
  imageId: z.string().optional(),
});

const importBodySchema = z.object({
  findings: z.array(importFindingSchema).min(1).max(500),
});

export interface ImportFindingError {
  index: number;
  message: string;
}

interface SessionInfo {
  name: string;
  namingScheme: string | null;
  /** How many findings this session had before the import started. */
  existingCount: number;
  /** Incremented as we create findings in this batch. */
  batchOffset: number;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parseResult = importBodySchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { errors: parseResult.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { findings } = parseResult.data;

  // ── Pre-fetch session info for naming scheme application ──
  // Only fetch sessions that belong to this user (ownership check).
  const uniqueSessionIds = [
    ...new Set(findings.map((f) => f.fieldSessionId).filter(Boolean) as string[]),
  ];

  const sessionCache = new Map<string, SessionInfo>();

  for (const sessionId of uniqueSessionIds) {
    const fieldSession = await prisma.fieldSession.findFirst({
      where: { id: sessionId, userId: session.user.id },
      select: {
        name: true,
        namingScheme: true,
        _count: { select: { findings: true } },
      },
    });
    if (fieldSession) {
      sessionCache.set(sessionId, {
        name: fieldSession.name,
        namingScheme: fieldSession.namingScheme,
        existingCount: fieldSession._count.findings,
        batchOffset: 0,
      });
    }
    // If the session isn't found or doesn't belong to this user,
    // it's silently skipped — the finding will be created without a session link.
  }

  const created: string[] = [];
  const errors: ImportFindingError[] = [];
  const duplicates: number[] = [];

  for (let i = 0; i < findings.length; i++) {
    const f = findings[i];
    try {
      // Duplicate check: existing finding at exact same coordinates for this user
      const existing = await prisma.finding.findFirst({
        where: { userId: session.user.id, latitude: f.lat, longitude: f.lng },
        select: { id: true },
      });
      if (existing) duplicates.push(i);

      // Resolve field session ID — drop it if session not owned by user
      const validSessionId =
        f.fieldSessionId && sessionCache.has(f.fieldSessionId)
          ? f.fieldSessionId
          : null;

      // Apply naming scheme when:
      //   - a session with a naming scheme is referenced
      //   - the finding has no explicit name (GPX waypoints often do; images use filename)
      let resolvedName = f.name ?? null;
      if (validSessionId && !resolvedName) {
        const info = sessionCache.get(validSessionId)!;
        if (info.namingScheme) {
          const n = info.existingCount + info.batchOffset + 1;
          resolvedName = applyNamingScheme(
            info.namingScheme,
            info.name,
            n,
            f.foundAt ? new Date(f.foundAt) : new Date()
          );
        }
      }

      // Increment the per-session batch counter regardless (keeps numbering correct
      // even if some findings have explicit names and others don't).
      if (validSessionId) {
        const info = sessionCache.get(validSessionId)!;
        info.batchOffset += 1;
      }

      const adminUnits = await lookupAdminUnits(f.lat, f.lng);

      const finding = await prisma.finding.create({
        data: {
          latitude: f.lat,
          longitude: f.lng,
          name: resolvedName,
          description: f.description ?? null,
          foundAt: f.foundAt ? new Date(f.foundAt) : new Date(),
          depth: f.depth ?? null,
          conductivity: f.conductivity ?? null,
          fieldSessionId: validSessionId,
          userId: session.user.id,
          ...adminUnits,
          ...(f.imageId ? { images: { connect: { id: f.imageId } } } : {}),
        },
      });

      created.push(finding.id);
    } catch (err) {
      errors.push({
        index: i,
        message: err instanceof Error ? err.message : "Unbekannter Fehler",
      });
    }
  }

  revalidatePath("/findings");
  revalidatePath("/community");

  return NextResponse.json(
    { created: created.length, createdIds: created, duplicates, errors },
    { status: 201 }
  );
}
