import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { findingSchemaCompleted } from "@detektor-hub/shared";
import { logActivity } from "@/lib/activityLog";
import { lookupAdminUnits } from "@/lib/geo";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    const finding = await prisma.finding.findUnique({
      where: { id },
      include: {
        tags: true,
        user: true,
        images: true,
        // Include both sides of the symmetric self-relation and merge client-side
        relatedTo: {
          select: {
            id: true,
            name: true,
            foundAt: true,
            createdAt: true,
            images: { take: 1, select: { publicId: true } },
            user: { select: { id: true, name: true, image: true } },
          },
        },
        relatedFrom: {
          select: {
            id: true,
            name: true,
            foundAt: true,
            createdAt: true,
            images: { take: 1, select: { publicId: true } },
            user: { select: { id: true, name: true, image: true } },
          },
        },
      },
    });

    if (!finding) {
      return NextResponse.json(
        { error: "Fund nicht gefunden." },
        { status: 404 }
      );
    }

    // Owner gets full access
    if (session?.user?.id && finding.userId === session.user.id) {
      return NextResponse.json({ finding }, {
        headers: { "Cache-Control": "private, max-age=30, stale-while-revalidate=60" },
      });
    }

    // Public (COMPLETED) findings are readable — position only if locationPublic
    if (finding.status === "COMPLETED") {
      if (!finding.locationPublic) {
        const { latitude, longitude, ...publicFinding } = finding;
        return NextResponse.json({ finding: publicFinding });
      }
      return NextResponse.json({ finding });
    }

    // Everything else is forbidden — return 404 to avoid leaking existence
    return NextResponse.json({ error: "Fund nicht gefunden." }, { status: 404 });
  } catch (error) {
    console.error("Fehler beim Zugriff auf den Fund:", error);
    return NextResponse.json(
      { error: "Fehler beim Zugriff auf den Fund." },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  // Fetch existing record for ownership check and coord comparison
  const existing = await prisma.finding.findUnique({
    where: { id },
    select: { userId: true, latitude: true, longitude: true },
  });
  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json({ error: "Fund nicht gefunden." }, { status: 404 });
  }

  const body = await req.json();
  const parseResult = findingSchemaCompleted.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json({ errors: parseResult.error.flatten().fieldErrors }, { status: 400 });
  }

  const data = parseResult.data;

  // Only re-run the PostGIS lookup if the coordinates actually changed
  const coordsChanged =
    data.location.lat !== existing.latitude || data.location.lng !== existing.longitude;
  const adminUnits = coordsChanged
    ? await lookupAdminUnits(data.location.lat, data.location.lng)
    : {};

  try {
    const finding = await prisma.finding.update({
      where: { id },
      data: {
        name: data.name,
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
        thumbnailId: data.thumbnailId ?? null,
        foundAt: data.foundAt,
        ...adminUnits,
        images: { set: data.images.map((imgId) => ({ id: imgId })) },
        tags: { set: data.tags.map((tagId) => ({ id: tagId })) },
      },
    });
    await logActivity({
      userId: session.user.id,
      action: "finding.update",
      entityType: "finding",
      entityId: finding.id,
      metadata: { name: finding.name ?? undefined },
    });
    return NextResponse.json({ finding });
  } catch (error) {
    console.error("Fehler beim Aktualisieren des Fundes:", error);
    return NextResponse.json({ error: "Fehler beim Aktualisieren des Fundes." }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const existing = await prisma.finding.findUnique({ where: { id }, select: { userId: true, name: true, status: true, reported: true } });
  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json({ error: "Fund nicht gefunden." }, { status: 404 });
  }

  const body = await req.json();
  const schema = z.object({
    status: z.enum(["DRAFT", "COMPLETED"]).optional(),
    reported: z.boolean().optional(),
  });
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültige Daten." }, { status: 400 });
  }

  const finding = await prisma.finding.update({
    where: { id },
    data: parsed.data,
  });

  const action = parsed.data.status !== undefined ? "finding.update.status" : "finding.update.reported";
  const changes = parsed.data.status !== undefined
    ? [{ field: "status", before: existing.status, after: parsed.data.status }]
    : [{ field: "reported", before: existing.reported, after: parsed.data.reported }];

  await logActivity({
    userId: session.user.id,
    action,
    entityType: "finding",
    entityId: id,
    metadata: { name: existing.name ?? undefined },
    changes,
  });

  return NextResponse.json({ finding });
}
