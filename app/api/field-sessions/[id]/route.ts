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

  const fieldSession = await prisma.fieldSession.findUnique({
    where: { id },
    include: {
      detector: true,
      zone: { select: { id: true, name: true } },
      findings: { select: { id: true, name: true } },
    },
  });

  if (!fieldSession || fieldSession.userId !== session.user.id) {
    return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });
  }

  return NextResponse.json({ fieldSession });
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

  const { name, description, dateFrom, dateTo, zoneId, detectorId } =
    parseResult.data;

  // Verify the zone belongs to this user if provided
  if (zoneId) {
    const zone = await prisma.zone.findUnique({ where: { id: zoneId } });
    if (!zone || zone.userId !== session.user.id) {
      return NextResponse.json({ error: "Zone nicht gefunden." }, { status: 404 });
    }
  }

  const fieldSession = await prisma.fieldSession.update({
    where: { id },
    data: {
      name,
      description,
      dateFrom,
      dateTo: dateTo ?? null,
      zoneId: zoneId ?? null,
      detectorId: detectorId ?? null,
    },
  });

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
