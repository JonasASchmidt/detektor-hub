import prisma from "@/lib/prisma";
import { zoneSchema } from "@/schemas/zone";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Use raw query to include geometry as GeoJSON
  const zones = await prisma.$queryRaw<
    Array<{
      id: string;
      name: string;
      description: string | null;
      userId: string;
      createdAt: Date;
      updatedAt: Date;
      geometryGeoJson: string | null;
      sessionCount: bigint;
    }>
  >`
    SELECT
      z.id,
      z.name,
      z.description,
      z."userId",
      z."createdAt",
      z."updatedAt",
      ST_AsGeoJSON(z.geometry) AS "geometryGeoJson",
      COUNT(fs.id) AS "sessionCount"
    FROM "Zone" z
    LEFT JOIN "FieldSession" fs ON fs."zoneId" = z.id
    WHERE z."userId" = ${session.user.id}
    GROUP BY z.id
    ORDER BY z."createdAt" DESC
  `;

  const result = zones.map((z) => ({
    ...z,
    sessionCount: Number(z.sessionCount),
  }));

  return NextResponse.json({ zones: result });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

  const zone = await prisma.zone.create({
    data: {
      name,
      description,
      userId: session.user.id,
    },
  });

  if (geometry) {
    await prisma.$executeRaw`
      UPDATE "Zone"
      SET geometry = ST_GeomFromGeoJSON(${geometry})
      WHERE id = ${zone.id}
    `;
  }

  return NextResponse.json({ zone }, { status: 201 });
}
