import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const bodySchema = z.object({ findingId: z.string().uuid() });

// POST /api/collections/[id]/findings — add a finding to the collection (owner only)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const collection = await prisma.collection.findUnique({ where: { id }, select: { userId: true } });
  if (!collection || collection.userId !== session.user.id) {
    return NextResponse.json({ error: "Sammlung nicht gefunden." }, { status: 404 });
  }

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültige Daten." }, { status: 400 });
  }

  const { findingId } = parsed.data;

  // Verify the finding exists and is visible (COMPLETED or owned by the user)
  const finding = await prisma.finding.findUnique({
    where: { id: findingId },
    select: { status: true, userId: true },
  });
  if (!finding || (finding.status !== "COMPLETED" && finding.userId !== session.user.id)) {
    return NextResponse.json({ error: "Fund nicht gefunden." }, { status: 404 });
  }

  await prisma.collection.update({
    where: { id },
    data: { findings: { connect: { id: findingId } } },
  });

  return NextResponse.json({ ok: true });
}

// DELETE /api/collections/[id]/findings — remove a finding from the collection (owner only)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const collection = await prisma.collection.findUnique({ where: { id }, select: { userId: true } });
  if (!collection || collection.userId !== session.user.id) {
    return NextResponse.json({ error: "Sammlung nicht gefunden." }, { status: 404 });
  }

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültige Daten." }, { status: 400 });
  }

  await prisma.collection.update({
    where: { id },
    data: { findings: { disconnect: { id: parsed.data.findingId } } },
  });

  return NextResponse.json({ ok: true });
}
