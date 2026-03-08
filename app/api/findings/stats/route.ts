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

    const [totalFindings, findingsThisMonth, unidentifiedCount, mostUsedTagResult] =
      await Promise.all([
        prisma.finding.count({ where: { userId } }),
        prisma.finding.count({
          where: { userId, foundAt: { gte: firstOfMonth } },
        }),
        prisma.finding.count({
          where: { userId, status: "DRAFT" },
        }),
        prisma.tag.findMany({
          where: {
            findings: { some: { userId } },
          },
          select: {
            name: true,
            _count: { select: { findings: true } },
          },
          orderBy: {
            findings: { _count: "desc" },
          },
          take: 1,
        }),
      ]);

    const mostUsedTag =
      mostUsedTagResult.length > 0
        ? { name: mostUsedTagResult[0].name, count: mostUsedTagResult[0]._count.findings }
        : null;

    return NextResponse.json({
      totalFindings,
      findingsThisMonth,
      mostUsedTag,
      unidentifiedCount,
    });
  } catch (error) {
    console.error("Error fetching finding stats:", error);
    return NextResponse.json(
      { error: "Error fetching stats" },
      { status: 500 }
    );
  }
}
