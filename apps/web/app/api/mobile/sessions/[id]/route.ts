import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getMobileSession } from "@/lib/mobile-auth";

/**
 * GET /api/mobile/sessions/:id
 * Returns a single field session for the authenticated user.
 * Used by the mobile app when resuming a synced session.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getMobileSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const fieldSession = await prisma.fieldSession.findUnique({
    where: { id },
    include: {
      detector: true,
      zone: { select: { id: true, name: true } },
      findings: { select: { id: true } },
    },
  });

  if (!fieldSession || fieldSession.userId !== session.id) {
    return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });
  }

  return NextResponse.json({ fieldSession });
}

/**
 * PATCH /api/mobile/sessions/:id
 * Updates a field session — currently used only to set dateTo (mark as ended).
 * Body: { dateTo: string (ISO) }
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
  if (!body?.dateTo) {
    return NextResponse.json({ error: "dateTo fehlt." }, { status: 400 });
  }

  const updated = await prisma.fieldSession.update({
    where: { id },
    data: { dateTo: new Date(body.dateTo) },
  });

  return NextResponse.json({ fieldSession: updated });
}
