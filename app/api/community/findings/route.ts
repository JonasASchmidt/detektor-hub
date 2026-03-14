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

  const where = {
    AND: [
      { status: "COMPLETED" as const },
      search ? { name: { contains: search, mode: "insensitive" as const } } : {},
      ...(tagIds.length > 0 ? [{ tags: { some: { id: { in: tagIds } } } }] : []),
      ...(dateFrom ? [{ foundAt: { gte: new Date(dateFrom) } }] : []),
      ...(dateTo ? [{ foundAt: { lte: new Date(dateTo) } }] : []),
    ],
  };

  try {
    const findings = await prisma.finding.findMany({
      where,
      include: {
        images: true,
        tags: true,
        user: { select: { name: true, image: true } },
        comments: {
          where: { parentId: null },
          orderBy: { createdAt: "desc" },
          take: 1,
          include: { user: { select: { name: true, image: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    });

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
      latitude: f.latitude,
      longitude: f.longitude,
      user: { name: f.user?.name ?? null, image: f.user?.image ?? null },
      latestComment: f.comments[0]
        ? {
            id: f.comments[0].id,
            text: f.comments[0].text,
            createdAt: f.comments[0].createdAt,
            userName: f.comments[0].user?.name ?? null,
            userImage: f.comments[0].user?.image ?? null,
          }
        : null,
    }));

    const total = await prisma.finding.count({ where });

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
