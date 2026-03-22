import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getMobileSession } from "@/lib/mobile-auth";

/**
 * PATCH /api/mobile/sessions/[id]/route
 * Saves the GPS route for a session (same logic as the web field-sessions route endpoint).
 * Body: { coordinates: [[lng, lat], ...] }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getMobileSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const fieldSession = await prisma.fieldSession.findUnique({ where: { id } });
  if (!fieldSession || fieldSession.userId !== session.id) {
    return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const { coordinates } = body ?? {};
  if (!Array.isArray(coordinates) || coordinates.length < 2) {
    return NextResponse.json({ error: "Mindestens 2 Koordinaten erforderlich." }, { status: 400 });
  }

  const geoJson = JSON.stringify({ type: "LineString", coordinates });

  // PostGIS geometry fields cannot be set via prisma.update — use raw SQL
  // matching the pattern in /api/field-sessions/[id]/route/route.ts
  await prisma.$executeRaw`
    UPDATE "FieldSession"
    SET route = ST_GeomFromGeoJSON(${geoJson})
    WHERE id = ${id}
  `;

  return NextResponse.json({ ok: true });
}
