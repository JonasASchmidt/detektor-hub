import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const bodySchema = z.object({ relatedId: z.string().uuid() });

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  // Only the owner of the current finding may add links
  const finding = await prisma.finding.findUnique({
    where: { id },
    select: { userId: true },
  });
  if (!finding || finding.userId !== session.user.id) {
    return NextResponse.json({ error: "Fund nicht gefunden." }, { status: 404 });
  }

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültige Daten." }, { status: 400 });
  }

  const { relatedId } = parsed.data;

  if (relatedId === id) {
    return NextResponse.json(
      { error: "Ein Fund kann nicht mit sich selbst verknüpft werden." },
      { status: 400 }
    );
  }

  // Verify the target finding exists and is visible (COMPLETED or owned by the user)
  const target = await prisma.finding.findUnique({
    where: { id: relatedId },
    select: { status: true, userId: true },
  });
  if (
    !target ||
    (target.status !== "COMPLETED" && target.userId !== session.user.id)
  ) {
    return NextResponse.json({ error: "Fund nicht gefunden." }, { status: 404 });
  }

  // Connect via relatedTo — the relation is readable from both sides via relatedTo ∪ relatedFrom
  await prisma.finding.update({
    where: { id },
    data: { relatedTo: { connect: { id: relatedId } } },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const finding = await prisma.finding.findUnique({
    where: { id },
    select: { userId: true },
  });
  if (!finding || finding.userId !== session.user.id) {
    return NextResponse.json({ error: "Fund nicht gefunden." }, { status: 404 });
  }

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültige Daten." }, { status: 400 });
  }

  const { relatedId } = parsed.data;

  // The link may exist in either direction in the junction table — disconnect both to be safe
  await prisma.finding.update({
    where: { id },
    data: {
      relatedTo: { disconnect: { id: relatedId } },
      relatedFrom: { disconnect: { id: relatedId } },
    },
  });

  return NextResponse.json({ ok: true });
}
