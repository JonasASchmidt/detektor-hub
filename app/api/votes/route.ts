import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

// POST /api/votes — toggle a vote for any entity
// Body: { targetType: "FINDING" | "COMMENT" | ..., targetId: string }
// Returns: { voted: boolean, votesCount: number }
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { targetType, targetId } = await req.json();
  if (!targetType || !targetId) {
    return NextResponse.json({ error: "targetType und targetId erforderlich." }, { status: 400 });
  }

  // Only allow voting on known entity types
  const ALLOWED_TARGET_TYPES = new Set(["FINDING"]);
  if (!ALLOWED_TARGET_TYPES.has(targetType)) {
    return NextResponse.json({ error: "Ungültiger Zieltyp." }, { status: 400 });
  }

  const userId = session.user.id;

  // For findings: verify it exists, is COMPLETED, and not owned by the voter
  if (targetType === "FINDING") {
    const finding = await prisma.finding.findUnique({
      where: { id: targetId, status: "COMPLETED" },
      select: { userId: true },
    });
    if (!finding) {
      return NextResponse.json({ error: "Fund nicht gefunden." }, { status: 404 });
    }
    if (finding.userId === userId) {
      return NextResponse.json(
        { error: "Eigene Funde können nicht bewertet werden." },
        { status: 403 }
      );
    }
  }

  const existing = await prisma.vote.findUnique({
    where: { userId_targetType_targetId: { userId, targetType, targetId } },
  });

  let voted: boolean;
  if (existing) {
    await prisma.vote.delete({ where: { id: existing.id } });
    voted = false;
  } else {
    await prisma.vote.create({ data: { userId, targetType, targetId } });
    voted = true;
  }

  const votesCount = await prisma.vote.count({ where: { targetType, targetId } });
  return NextResponse.json({ voted, votesCount });
}
