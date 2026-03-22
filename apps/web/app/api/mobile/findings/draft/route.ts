import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getMobileSession } from "@/lib/mobile-auth";
import { findingDraftSchema } from "@detektor-hub/shared";

/**
 * POST /api/mobile/findings/draft
 * Saves a quick find from the mobile field mode as a DRAFT finding.
 * Body: { name?, location: {lat, lng}, description?, conductivity?, foundAt, images[], fieldSessionId? }
 */
export async function POST(req: NextRequest) {
  const session = await getMobileSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = findingDraftSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { name, location, description, conductivity, foundAt, images, fieldSessionId } = parsed.data;

  // Verify the field session belongs to this user if provided
  if (fieldSessionId) {
    const fs = await prisma.fieldSession.findUnique({ where: { id: fieldSessionId } });
    if (!fs || fs.userId !== session.id) {
      return NextResponse.json({ error: "Session nicht gefunden." }, { status: 404 });
    }
  }

  const finding = await prisma.finding.create({
    data: {
      name: name ?? null,
      latitude: location.lat,
      longitude: location.lng,
      description: description ?? null,
      conductivity: conductivity ?? null,
      foundAt,
      status: "DRAFT",
      userId: session.id,
      fieldSessionId: fieldSessionId ?? null,
      ...(images.length > 0
        ? { images: { connect: images.map((id) => ({ id })) } }
        : {}),
    },
  });

  return NextResponse.json({ finding }, { status: 201 });
}
