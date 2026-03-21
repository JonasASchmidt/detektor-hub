import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const importSessionSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  dateFrom: z.string().datetime(),
  dateTo: z.string().datetime().optional(),
  /** GeoJSON LineString coordinates [[lng, lat], ...] */
  routeCoordinates: z.array(z.tuple([z.number(), z.number()])).optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parseResult = importSessionSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { errors: parseResult.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { name, description, dateFrom, dateTo, routeCoordinates } =
    parseResult.data;

  const fieldSession = await prisma.fieldSession.create({
    data: {
      name,
      description: description ?? null,
      dateFrom: new Date(dateFrom),
      dateTo: dateTo ? new Date(dateTo) : null,
      userId: session.user.id,
    },
  });

  // Store route geometry via raw SQL (PostGIS ST_GeomFromGeoJSON)
  if (routeCoordinates && routeCoordinates.length >= 2) {
    const geoJson = JSON.stringify({
      type: "LineString",
      coordinates: routeCoordinates,
    });
    await prisma.$executeRaw`
      UPDATE "FieldSession"
      SET route = ST_GeomFromGeoJSON(${geoJson})
      WHERE id = ${fieldSession.id}
    `;
  }

  return NextResponse.json({ fieldSession }, { status: 201 });
}
