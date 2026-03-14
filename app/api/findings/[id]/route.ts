import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { findingSchemaCompleted } from "@/schemas/finding";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const finding = await prisma.finding.findUnique({
      where: { id },
      include: {
        tags: true,
        user: true,
        images: true,
      },
    });

    if (!finding) {
      return NextResponse.json(
        { error: "Fund nicht gefunden." },
        { status: 404 }
      );
    }

    return NextResponse.json({ finding }, {
      headers: { "Cache-Control": "private, max-age=30, stale-while-revalidate=60" },
    });
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

  const body = await req.json();
  const parseResult = findingSchemaCompleted.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json({ errors: parseResult.error.flatten().fieldErrors }, { status: 400 });
  }

  const data = parseResult.data;

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
        description_front: data.description_front,
        description_back: data.description_back,
        dating: data.dating,
        dating_from: data.dating_from,
        dating_to: data.dating_to,
        references: data.references,
        thumbnailId: data.thumbnailId ?? null,
        foundAt: data.foundAt,
        images: { set: data.images.map((imgId) => ({ id: imgId })) },
        tags: { set: data.tags.map((tagId) => ({ id: tagId })) },
      },
    });
    return NextResponse.json({ finding });
  } catch (error) {
    console.error("Fehler beim Aktualisieren des Fundes:", error);
    return NextResponse.json({ error: "Fehler beim Aktualisieren des Fundes." }, { status: 500 });
  }
}
