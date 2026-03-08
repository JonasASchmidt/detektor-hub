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

  try {
    const [findings, total] = await Promise.all([
      prisma.finding.findMany({
        include: { images: true, tags: true },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.finding.count(),
    ]);

    // Anonymize: no user info, no position data whatsoever
    const anonymized = findings.map((f) => ({
      id: f.id,
      name: f.name,
      description: f.description,
      status: f.status,
      createdAt: f.createdAt,
      foundAt: f.foundAt,
      dating: f.dating,
      images: f.images,
      tags: f.tags,
    }));

    return NextResponse.json(
      { findings: anonymized, total },
      {
        headers: {
          "Cache-Control":
            "private, max-age=60, stale-while-revalidate=120",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching community findings:", error);
    return NextResponse.json(
      { error: "Error fetching community findings" },
      { status: 500 }
    );
  }
}
