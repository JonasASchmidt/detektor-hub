import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getMobileSession } from "@/lib/mobile-auth";
import { fieldSessionSchema } from "@detektor-hub/shared";

/**
 * GET /api/mobile/sessions
 * Returns all field sessions for the authenticated user, ordered newest first.
 * Add ?open=true to return only sessions without an end date.
 */
export async function GET(req: NextRequest) {
  const session = await getMobileSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const onlyOpen = req.nextUrl.searchParams.get("open") === "true";

  const fieldSessions = await prisma.fieldSession.findMany({
    where: {
      userId: session.id,
      ...(onlyOpen ? { dateTo: null } : {}),
    },
    include: {
      detector: true,
      zone: { select: { id: true, name: true } },
      findings: { select: { id: true } },
    },
    orderBy: { dateFrom: "desc" },
  });

  return NextResponse.json({ fieldSessions });
}

/**
 * POST /api/mobile/sessions
 * Creates a new field session. Body: { name, namingScheme?, dateFrom, zoneId?, detectorId? }
 */
export async function POST(req: NextRequest) {
  const session = await getMobileSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = fieldSessionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { name, description, namingScheme, dateFrom, dateTo, zoneId, detectorId } = parsed.data;

  const fieldSession = await prisma.fieldSession.create({
    data: {
      name,
      description,
      namingScheme: namingScheme ?? null,
      dateFrom,
      dateTo: dateTo ?? null,
      zoneId: zoneId ?? null,
      userId: session.id,
      ...(detectorId ? { detectorId } : {}),
    },
  });

  return NextResponse.json({ fieldSession }, { status: 201 });
}
