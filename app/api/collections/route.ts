import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const createSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().nullable().optional(),
});

// GET /api/collections — returns all collections (public), or filtered by ?userId=
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  const collections = await prisma.collection.findMany({
    where: userId ? { userId } : undefined,
    include: {
      user: { select: { id: true, name: true, image: true } },
      findings: {
        take: 1,
        select: { images: { take: 1, select: { publicId: true } } },
      },
      _count: { select: { findings: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ collections });
}

// POST /api/collections — create a new collection
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const collection = await prisma.collection.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      userId: session.user.id,
    },
  });

  return NextResponse.json({ collection }, { status: 201 });
}
