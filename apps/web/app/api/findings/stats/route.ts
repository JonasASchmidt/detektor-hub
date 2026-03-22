import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalFindings, findingsThisMonth, draftCount, commentsCount, findingsWithTags] =
      await Promise.all([
        prisma.finding.count({ where: { userId } }),
        prisma.finding.count({
          where: { userId, foundAt: { gte: firstOfMonth } },
        }),
        prisma.finding.count({
          where: { userId, status: "DRAFT" },
        }),
        prisma.comment.count({
          where: {
            OR: [
              { userId },
              { finding: { userId } }
            ]
          }
        }),
        prisma.finding.findMany({
          where: { userId },
          select: { tags: { select: { id: true, name: true, color: true } } },
        }),
      ]);

    const tagCounts = new Map<string, { name: string; color: string; count: number }>();
    for (const finding of findingsWithTags) {
      for (const tag of finding.tags) {
        const existing = tagCounts.get(tag.id);
        if (existing) existing.count++;
        else tagCounts.set(tag.id, { name: tag.name, color: tag.color ?? "#888", count: 1 });
      }
    }
    const topEntry = [...tagCounts.entries()].sort((a, b) => b[1].count - a[1].count)[0];
    const mostUsedTag = topEntry
      ? { id: topEntry[0], name: topEntry[1].name, color: topEntry[1].color, count: topEntry[1].count }
      : null;

    return NextResponse.json(
      { totalFindings, findingsThisMonth, mostUsedTag, draftCount, commentsCount },
      { headers: { "Cache-Control": "private, max-age=60, stale-while-revalidate=300" } }
    );
  } catch (error) {
    console.error("Error fetching finding stats:", error);
    return NextResponse.json(
      { error: "Error fetching stats" },
      { status: 500 }
    );
  }
}
