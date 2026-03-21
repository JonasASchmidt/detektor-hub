import prisma from "@/lib/prisma";
import { findingSchemaCompleted, findingDraftSchema } from "@/schemas/finding";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { FindingStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { ACTIVE_SESSION_COOKIE } from "@/app/api/active-session/route";
import { logActivity } from "@/lib/activityLog";
import { applyNamingScheme } from "@/lib/namingScheme";
import { lookupAdminUnits } from "@/lib/geo";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const userId = session.user.id;

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
  const hasCommentsParam = searchParams.get("hasComments");
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
      { userId },
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
      ...(hasCommentsParam === "true" ? [{ comments: { some: {} } }] : []),
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

/** Use explicit fieldSessionId if provided, otherwise fall back to the active session cookie. */
async function resolveFieldSessionId(
  explicit: string | null | undefined,
  userId: string
): Promise<string | null> {
  if (explicit) return explicit;
  const cookieStore = await cookies();
  const activeId = cookieStore.get(ACTIVE_SESSION_COOKIE)?.value;
  if (!activeId) return null;
  // Verify the cookie references a session that still belongs to this user
  const exists = await prisma.fieldSession.findFirst({
    where: { id: activeId, userId },
    select: { id: true },
  });
  return exists?.id ?? null;
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

  // Auto-generate name from session naming scheme if no explicit name provided
  let resolvedName = data.name || null;
  const resolvedSessionId = await resolveFieldSessionId(data.fieldSessionId, session.user.id);
  if (!resolvedName && resolvedSessionId) {
    const fieldSession = await prisma.fieldSession.findUnique({
      where: { id: resolvedSessionId },
      select: { name: true, namingScheme: true, _count: { select: { findings: true } } },
    });
    if (fieldSession?.namingScheme) {
      resolvedName = applyNamingScheme(
        fieldSession.namingScheme,
        fieldSession.name,
        fieldSession._count.findings + 1,
        data.foundAt ? new Date(data.foundAt) : new Date()
      );
    }
  }

  const adminUnits = await lookupAdminUnits(data.location.lat, data.location.lng);

  const finding = await prisma.finding.create({
    data: {
      name: resolvedName,
      latitude: data.location.lat,
      longitude: data.location.lng,
      depth: data.depth,
      weight: data.weight,
      diameter: data.diameter,
      description: data.description,
      descriptionFront: data.descriptionFront,
      descriptionBack: data.descriptionBack,
      dating: data.dating,
      datingFrom: data.datingFrom,
      datingTo: data.datingTo,
      references: data.references,
      locationPublic: data.locationPublic ?? false,
      thumbnailId: data.thumbnailId,
      foundAt: data.foundAt,
      fieldSessionId: resolvedSessionId,
      userId: session.user.id,
      ...adminUnits,
      images: {
        connect: data.images.map((imageId) => ({ id: imageId })),
      },
      tags: {
        connect: data.tags.map((tagId) => ({ id: tagId })),
      },
    },
  });

  await logActivity({
    userId: session.user.id,
    action: "finding.create",
    entityType: "finding",
    entityId: finding.id,
    metadata: { name: finding.name ?? undefined },
  });

  revalidatePath("/findings");
  revalidatePath("/community");
  return NextResponse.json({ finding }, { status: 201 });
}
