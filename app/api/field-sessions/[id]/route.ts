import prisma from "@/lib/prisma";
import { fieldSessionSchema } from "@/schemas/field-session";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Raw query to include zone as GeoJSON string
  const rows = await prisma.$queryRaw<Array<Record<string, unknown>>>`
    SELECT
      id, name, description, "dateFrom", "dateTo",
      "detectorId", "userId", "createdAt", "updatedAt",
      ST_AsGeoJSON(zone) as zone
    FROM "FieldSession"
    WHERE id = ${id} AND "userId" = ${session.user.id}
  `;

  if (!rows.length) {
    return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });
  }

  // Also fetch relations via Prisma
  const details = await prisma.fieldSession.findUnique({
    where: { id },
    include: {
      detector: true,
      findings: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ fieldSession: { ...rows[0], ...details } });
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { findingIds, ...rest } = body;
  const parseResult = fieldSessionSchema.safeParse(rest);
  if (!parseResult.success) {
    return NextResponse.json(
      { errors: parseResult.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const existing = await prisma.fieldSession.findUnique({ where: { id } });
  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });
  }

  const { name, description, dateFrom, dateTo, zone, detectorId } =
    parseResult.data;

  const fieldSession = await prisma.fieldSession.update({
    where: { id },
    data: {
      name,
      description,
      dateFrom,
      dateTo: dateTo ?? null,
      detectorId: detectorId ?? null,
    },
  });

  // Update zone via raw SQL
  if (zone !== undefined) {
    if (zone) {
      await prisma.$executeRaw`
        UPDATE "FieldSession"
        SET zone = ST_GeomFromGeoJSON(${zone})
        WHERE id = ${id}
      `;
    } else {
      await prisma.$executeRaw`
        UPDATE "FieldSession"
        SET zone = NULL
        WHERE id = ${id}
      `;
    }
  }

  // Re-link findings: unlink all current, then link the new selection
  if (Array.isArray(findingIds)) {
    await prisma.finding.updateMany({
      where: { fieldSessionId: id, userId: session.user.id },
      data: { fieldSessionId: null },
    });
    if (findingIds.length > 0) {
      await prisma.finding.updateMany({
        where: { id: { in: findingIds }, userId: session.user.id },
        data: { fieldSessionId: id },
      });
    }
  }

  return NextResponse.json({ fieldSession });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.fieldSession.findUnique({ where: { id } });
  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });
  }

  await prisma.fieldSession.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
