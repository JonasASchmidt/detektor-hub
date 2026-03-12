import prisma from "@/lib/prisma";
import { findingSchemaCompleted } from "@/schemas/finding";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { FindingStatus } from "@prisma/client";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("q") || "";
  const orderBy = searchParams.get("orderBy") || "createdAt";
  const order = searchParams.get("order") || "desc";
  const tag = searchParams.get("tag");
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "20");

  // New filter params
  const status = searchParams.get("status");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const tagsParam = searchParams.get("tags"); // comma-separated
  const tagIds = tagsParam ? tagsParam.split(",").filter(Boolean) : tag ? [tag] : [];
  const reportedParam = searchParams.get("reported");
  const lat = searchParams.get("lat") ? parseFloat(searchParams.get("lat")!) : null;
  const lng = searchParams.get("lng") ? parseFloat(searchParams.get("lng")!) : null;
  const radius = searchParams.get("radius") ? parseFloat(searchParams.get("radius")!) : null;

  // Location bounding box: convert center + radius (km) to lat/lng bounds
  // 1 degree latitude ~ 111km, 1 degree longitude ~ 111km * cos(lat)
  let locationFilter = {};
  if (lat !== null && lng !== null && radius !== null) {
    const latDelta = radius / 111;
    const lngDelta = radius / (111 * Math.cos((lat * Math.PI) / 180));
    locationFilter = {
      latitude: { gte: lat - latDelta, lte: lat + latDelta },
      longitude: { gte: lng - lngDelta, lte: lng + lngDelta },
    };
  }

  const skip = (page - 1) * pageSize;

  const where = {
    AND: [
      search
        ? {
            name: {
              contains: search,
              mode: "insensitive" as const,
            },
          }
        : {},
      ...(tagIds.length > 0 ? [{ tags: { some: { id: { in: tagIds } } } }] : []),
      ...(status
        ? status.includes(",")
          ? [{ status: { in: status.split(",") as FindingStatus[] } }]
          : [{ status: status as FindingStatus }]
        : []),
      ...(dateFrom ? [{ foundAt: { gte: new Date(dateFrom) } }] : []),
      ...(dateTo ? [{ foundAt: { lte: new Date(dateTo) } }] : []),
      ...(reportedParam !== null ? [{ reported: reportedParam === "true" }] : []),
      ...(lat !== null && lng !== null && radius !== null ? [locationFilter] : []),
    ],
  };

  try {
    const findings = await prisma.finding.findMany({
      where,
      include: { images: true, tags: true, user: true },
      orderBy: { [orderBy]: order },
      skip,
      take: pageSize,
    });

    const total = await prisma.finding.count({ where });

    return NextResponse.json(
      { findings, total },
      { headers: { "Cache-Control": "private, max-age=30, stale-while-revalidate=60" } }
    );
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
      thumbnailId: data.thumbnailId,
      foundAt: data.foundAt,
      fieldSessionId: data.fieldSessionId ?? null,
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
