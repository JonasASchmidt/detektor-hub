import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional().nullable(),
});

// GET /api/collections/[id] — fetch a single collection with all its findings
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const collection = await prisma.collection.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, image: true } },
      findings: {
        where: { status: "COMPLETED" },
        include: {
          images: true,
          tags: true,
          user: { select: { id: true, name: true, image: true } },
        },
        orderBy: { foundAt: "desc" },
      },
      _count: { select: { findings: true } },
    },
  });

  if (!collection) {
    return NextResponse.json({ error: "Sammlung nicht gefunden." }, { status: 404 });
  }

  return NextResponse.json({ collection });
}

// PUT /api/collections/[id] — update name/description (owner only)
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const existing = await prisma.collection.findUnique({ where: { id }, select: { userId: true } });
  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json({ error: "Sammlung nicht gefunden." }, { status: 404 });
  }

  const parsed = updateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const collection = await prisma.collection.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json({ collection });
}

// DELETE /api/collections/[id] — delete collection (owner only)
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const existing = await prisma.collection.findUnique({ where: { id }, select: { userId: true } });
  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json({ error: "Sammlung nicht gefunden." }, { status: 404 });
  }

  await prisma.collection.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
