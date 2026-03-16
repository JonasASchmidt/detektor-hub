import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const routeBodySchema = z.object({
  /** GeoJSON LineString coordinates: [[lng, lat], [lng, lat], ...] */
  coordinates: z
    .array(z.tuple([z.number(), z.number()]))
    .min(2, "Mindestens 2 Punkte erforderlich."),
});

export async function PATCH(
  req: Request,
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

  const body = await req.json();
  const parseResult = routeBodySchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { errors: parseResult.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { coordinates } = parseResult.data;
  const geoJson = JSON.stringify({ type: "LineString", coordinates });

  await prisma.$executeRaw`
    UPDATE "FieldSession"
    SET route = ST_GeomFromGeoJSON(${geoJson})
    WHERE id = ${id}
  `;

  return NextResponse.json({ success: true });
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

  await prisma.$executeRaw`
    UPDATE "FieldSession" SET route = NULL WHERE id = ${id}
  `;

  return NextResponse.json({ success: true });
}
