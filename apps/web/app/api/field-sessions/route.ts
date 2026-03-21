import prisma from "@/lib/prisma";
import { fieldSessionSchema } from "@detektor-hub/shared";
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
      zone: { select: { id: true, name: true } },
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
  const { findingIds, ...rest } = body;
  const parseResult = fieldSessionSchema.safeParse(rest);
  if (!parseResult.success) {
    return NextResponse.json(
      { errors: parseResult.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { name, description, namingScheme, dateFrom, dateTo, zoneId, detectorId } =
    parseResult.data;

  // Verify the zone belongs to this user if provided
  if (zoneId) {
    const zone = await prisma.zone.findUnique({ where: { id: zoneId } });
    if (!zone || zone.userId !== session.user.id) {
      return NextResponse.json({ error: "Zone nicht gefunden." }, { status: 404 });
    }
  }

  const fieldSession = await prisma.fieldSession.create({
    data: {
      name,
      description,
      namingScheme: namingScheme ?? null,
      dateFrom,
      dateTo: dateTo ?? null,
      zoneId: zoneId ?? null,
      userId: session.user.id,
      ...(detectorId ? { detectorId } : {}),
    },
  });

  if (Array.isArray(findingIds) && findingIds.length > 0) {
    await prisma.finding.updateMany({
      where: { id: { in: findingIds }, userId: session.user.id },
      data: { fieldSessionId: fieldSession.id },
    });
  }

  return NextResponse.json({ fieldSession }, { status: 201 });
}
