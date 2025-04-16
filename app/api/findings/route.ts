import prisma from "@/lib/prisma";
import { findingSchemaCompleted } from "@/schemas/finding";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("q") || "";
  const orderBy = searchParams.get("orderBy") || "createdAt";
  const order = searchParams.get("order") || "desc";
  const tag = searchParams.get("tag");
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "20");

  const skip = (page - 1) * pageSize;

  try {
    const findings = await prisma.finding.findMany({
      where: {
        AND: [
          search
            ? {
                name: {
                  contains: search,
                  mode: "insensitive",
                },
              }
            : {},
          tag
            ? {
                tags: {
                  some: {
                    id: tag,
                  },
                },
              }
            : {},
        ],
      },
      include: { images: true, tags: true, user: true },
      orderBy: { [orderBy]: order },
      skip,
      take: pageSize,
    });

    const total = await prisma.finding.count();

    return NextResponse.json({ findings, total });
  } catch (error) {
    console.error("Error fetching findings:", error);
    return NextResponse.json(
      { error: "Error fetching findings" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const body = await req.json();
  const parseResult = findingSchemaCompleted.safeParse(body);

  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!parseResult.success) {
    return Response.json(
      { errors: parseResult.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const data = parseResult.data;

  const finding = await prisma.finding.create({
    data: {
      name: data.name,
      latitude: data.location.lat,
      longitude: data.location.lng,
      depth: data.depth,
      weight: data.weight,
      diameter: data.diameter,
      description: data.description,
      description_front: data.description_front,
      description_back: data.description_back,
      dating: data.dating,
      dating_from: data.dating_from,
      dating_to: data.dating_to,
      references: data.references,
      foundAt: data.foundAt,
      user: {
        connect: {
          id: session.user.id,
        },
      },
      images: {
        connect: data.images.map((imageId) => ({ id: imageId })),
      },
      tags: {
        connect: data.tags.map((tagId) => ({ id: tagId })),
      },
    },
  });

  return NextResponse.json({ finding }, { status: 201 });
}
