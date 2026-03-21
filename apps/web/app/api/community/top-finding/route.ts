import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

// GET /api/community/top-finding?period=week|year
// Returns the COMPLETED finding with the most votes in the given period.
// Falls back to all-time top if no votes exist in that window.
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") ?? "week";

  const now = new Date();
  let since: Date;
  if (period === "year") {
    since = new Date(now.getFullYear(), 0, 1); // Jan 1st this year
  } else {
    since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
  }

  // Find the finding ID with the most votes in the period
  const topVotes = await prisma.vote.groupBy({
    by: ["targetId"],
    where: { targetType: "FINDING", createdAt: { gte: since } },
    _count: { targetId: true },
    orderBy: { _count: { targetId: "desc" } },
    take: 1,
  });

  // Fall back to all-time if no votes in the period
  const allTimeTop =
    topVotes.length === 0
      ? await prisma.vote.groupBy({
          by: ["targetId"],
          where: { targetType: "FINDING" },
          _count: { targetId: true },
          orderBy: { _count: { targetId: "desc" } },
          take: 1,
        })
      : null;

  const topFindingId = topVotes[0]?.targetId ?? allTimeTop?.[0]?.targetId;
  const isFallback = topVotes.length === 0;

  if (!topFindingId) {
    return NextResponse.json({ finding: null });
  }

  const f = await prisma.finding.findUnique({
    where: { id: topFindingId, status: "COMPLETED" },
    include: {
      images: true,
      tags: true,
      user: { select: { id: true, name: true, image: true } },
      _count: { select: { comments: true } },
    },
  });

  if (!f) {
    return NextResponse.json({ finding: null });
  }

  // Total votes for this finding (all-time for display)
  const votesCount = await prisma.vote.count({
    where: { targetType: "FINDING", targetId: f.id },
  });

  // Whether the current user has voted
  const userVoted = !!(await prisma.vote.findUnique({
    where: {
      userId_targetType_targetId: {
        userId: session.user.id,
        targetType: "FINDING",
        targetId: f.id,
      },
    },
    select: { id: true },
  }));

  return NextResponse.json({
    finding: {
      id: f.id,
      name: f.name,
      description: f.description,
      createdAt: f.createdAt,
      foundAt: f.foundAt,
      dating: f.dating,
      thumbnailId: f.thumbnailId,
      images: f.images,
      tags: f.tags,
      status: f.status,
      reported: f.reported,
      commentsCount: f._count.comments,
      user: f.user,
      votesCount,
      userVoted,
    },
    period,
    isFallback,
  });
}
