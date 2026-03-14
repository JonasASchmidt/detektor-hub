import prisma from "@/lib/prisma";
import { zoneSchema } from "@/schemas/zone";
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

  const rows = await prisma.$queryRaw<Array<Record<string, unknown>>>`
    SELECT
      id, name, description, "userId", "createdAt", "updatedAt",
      ST_AsGeoJSON(geometry) AS "geometryGeoJson"
    FROM "Zone"
    WHERE id = ${id} AND "userId" = ${session.user.id}
  `;

  if (!rows.length) {
    return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });
  }

  return NextResponse.json({ zone: rows[0] });
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

  const existing = await prisma.zone.findUnique({ where: { id } });
  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });
  }

  const body = await req.json();
  const parseResult = zoneSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { errors: parseResult.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { name, description, geometry } = parseResult.data;

  const zone = await prisma.zone.update({
    where: { id },
    data: { name, description },
  });

  if (geometry !== undefined) {
    if (geometry) {
      await prisma.$executeRaw`
        UPDATE "Zone" SET geometry = ST_GeomFromGeoJSON(${geometry}) WHERE id = ${id}
      `;
    } else {
      await prisma.$executeRaw`
        UPDATE "Zone" SET geometry = NULL WHERE id = ${id}
      `;
    }
  }

  return NextResponse.json({ zone });
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

  const existing = await prisma.zone.findUnique({ where: { id } });
  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });
  }

  // Unlink sessions before deleting
  await prisma.fieldSession.updateMany({
    where: { zoneId: id },
    data: { zoneId: null },
  });

  await prisma.zone.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
