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
      search ? {
        name: { contains: search, mode: "insensitive" as const },
      } : {},
      ...(tagIds.length > 0 ? [{ tags: { some: { id: { in: tagIds } } } }] : []),
      ...(dateFrom ? [{ foundAt: { gte: new Date(dateFrom) } }] : []),
      ...(dateTo ? [{ foundAt: { lte: new Date(dateTo) } }] : []),
    ],
  };

  try {
    const [findings, comments] = await Promise.all([
      prisma.finding.findMany({
        where: { ...where, status: "COMPLETED" },
        include: { images: true, tags: true, user: { select: { name: true, image: true } } },
        orderBy: { createdAt: "desc" },
        take: pageSize,
      }),
      prisma.comment.findMany({
        where: { parentId: null }, // Only top-level comments for the feed
        include: { user: { select: { name: true, image: true } }, finding: { select: { id: true, name: true } }, attachments: true },
        orderBy: { createdAt: "desc" },
        take: pageSize,
      }),
    ]);

    // Anonymize and label
    const combined = [
      ...findings.map((f) => ({
        type: "finding" as const,
        id: f.id,
        name: f.name,
        description: f.description,
        createdAt: f.createdAt,
        foundAt: f.foundAt,
        dating: f.dating,
        images: f.images,
        tags: f.tags,
        userName: f.user?.name,
        userImage: f.user?.image,
      })),
      ...comments.map((c) => ({
        type: "comment" as const,
        id: c.id,
        text: c.text,
        createdAt: c.createdAt,
        userName: c.user?.name,
        userImage: c.user?.image,
        findingId: c.findingId,
        findingName: c.finding.name,
        images: c.attachments,
      })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json(
      { findings: combined.slice(0, pageSize), total: combined.length },
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
