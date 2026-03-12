import prisma from "@/lib/prisma";
import { fieldSessionSchema } from "@/schemas/field-session";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const fieldSessions = await prisma.fieldSession.findMany({
    where: { userId: session.user.id },
    include: {
      detector: true,
      findings: { select: { id: true } },
    },
    orderBy: { dateFrom: "desc" },
  });

  return NextResponse.json({ fieldSessions });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parseResult = fieldSessionSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { errors: parseResult.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { name, description, dateFrom, dateTo, zone, detectorId } =
    parseResult.data;

  // Create without zone first (Prisma doesn't support Unsupported geometry types)
  const fieldSession = await prisma.fieldSession.create({
    data: {
      name,
      description,
      dateFrom,
      dateTo: dateTo ?? null,
      userId: session.user.id,
      ...(detectorId ? { detectorId } : {}),
    },
  });

  // Set zone via raw SQL if provided
  if (zone) {
    await prisma.$executeRaw`
      UPDATE "FieldSession"
      SET zone = ST_GeomFromGeoJSON(${zone})
      WHERE id = ${fieldSession.id}
    `;
  }

  return NextResponse.json({ fieldSession }, { status: 201 });
}
