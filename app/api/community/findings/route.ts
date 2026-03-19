import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "20");
  const skip = (page - 1) * pageSize;

  const search = searchParams.get("q") || "";
  const tagsParam = searchParams.get("tags");
  const tagIds = tagsParam ? tagsParam.split(",").filter(Boolean) : [];
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const orderByParam = searchParams.get("orderBy") || "createdAt";
  const order = searchParams.get("order") || "desc";

  const where = {
    AND: [
      { status: "COMPLETED" as const },
      search ? { name: { contains: search, mode: "insensitive" as const } } : {},
      ...(tagIds.length > 0 ? [{ tags: { some: { id: { in: tagIds } } } }] : []),
      ...(dateFrom ? [{ foundAt: { gte: new Date(dateFrom) } }] : []),
      ...(dateTo ? [{ foundAt: { lte: new Date(dateTo) } }] : []),
    ],
  };

  const includeShape = {
    images: true,
    tags: true,
    user: { select: { id: true, name: true, image: true } },
    comments: {
      where: { parentId: null },
      orderBy: { createdAt: "desc" as const },
      take: 1,
      include: { user: { select: { name: true, image: true } } },
    },
    _count: { select: { comments: true } },
  } as const;

  try {
    let findings: Awaited<ReturnType<typeof prisma.finding.findMany<{ include: typeof includeShape }>>>;
    let total: number;

    if (orderByParam === "votes") {
      // For vote-sorted results: fetch all matching findings, sort by vote count in memory
      const allFindings = await prisma.finding.findMany({
        where,
        include: includeShape,
      });

      const findingIds = allFindings.map((f) => f.id);
      const voteCounts = await prisma.vote.groupBy({
        by: ["targetId"],
        where: { targetType: "FINDING", targetId: { in: findingIds } },
        _count: { targetId: true },
      });
      const voteCountMap = Object.fromEntries(
        voteCounts.map((v) => [v.targetId, v._count.targetId])
      );

      allFindings.sort(
        (a, b) => (voteCountMap[b.id] ?? 0) - (voteCountMap[a.id] ?? 0)
      );

      total = allFindings.length;
      findings = allFindings.slice(skip, skip + pageSize);
    } else {
      const prismaOrderBy = { [orderByParam]: order };
      [findings, total] = await Promise.all([
        prisma.finding.findMany({
          where,
          include: includeShape,
          orderBy: prismaOrderBy,
          skip,
          take: pageSize,
        }),
        prisma.finding.count({ where }),
      ]);
    }

    // Fetch vote counts for returned findings in one query
    const pageIds = findings.map((f) => f.id);
    const voteCounts = await prisma.vote.groupBy({
      by: ["targetId"],
      where: { targetType: "FINDING", targetId: { in: pageIds } },
      _count: { targetId: true },
    });
    const voteCountMap = Object.fromEntries(
      voteCounts.map((v) => [v.targetId, v._count.targetId])
    );

    // Fetch which findings the current user has voted for
    const userVotes = await prisma.vote.findMany({
      where: { targetType: "FINDING", targetId: { in: pageIds }, userId: session.user.id },
      select: { targetId: true },
    });
    const userVotedSet = new Set(userVotes.map((v) => v.targetId));

    const result = findings.map((f) => ({
      type: "finding" as const,
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
      userId: f.userId,
      commentsCount: f._count.comments,
      votesCount: voteCountMap[f.id] ?? 0,
      userVoted: userVotedSet.has(f.id),
      user: { id: f.user?.id ?? null, name: f.user?.name ?? null, image: f.user?.image ?? null },
      latestComment: f.comments[0]
        ? {
            id: f.comments[0].id,
            text: f.comments[0].text,
            createdAt: f.comments[0].createdAt,
            userId: f.comments[0].user?.id ?? null,
            userName: f.comments[0].user?.name ?? null,
            userImage: f.comments[0].user?.image ?? null,
          }
        : null,
    }));

    return NextResponse.json(
      { findings: result, total },
      {
        headers: {
          "Cache-Control": "private, max-age=60, stale-while-revalidate=120",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching community activities:", error);
    return NextResponse.json(
      { error: "Error fetching community activities" },
      { status: 500 }
    );
  }
}
