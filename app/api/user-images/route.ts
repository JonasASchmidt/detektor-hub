import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const images = await prisma.image.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: { tags: true },
    });
    return NextResponse.json(images, {
      headers: { "Cache-Control": "private, max-age=30, stale-while-revalidate=60" },
    });
  } catch {
    const images = await prisma.image.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(images, {
      headers: { "Cache-Control": "private, max-age=30, stale-while-revalidate=60" },
    });
  }
}
