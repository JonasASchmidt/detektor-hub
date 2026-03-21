import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import cloudinary from "@/lib/cloudinary";
import { z } from "zod";

const patchSchema = z.object({
  title: z.string().max(255).optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = patchSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültige Daten." }, { status: 400 });
  }

  const image = await prisma.image.findUnique({ where: { id } });
  if (!image || image.userId !== session.user.id) {
    return NextResponse.json({ error: "Foto nicht gefunden." }, { status: 404 });
  }

  const { tags, ...rest } = parsed.data;
  const updated = await prisma.image.update({
    where: { id },
    data: {
      ...rest,
      ...(tags !== undefined && { tags: { set: tags.map((tagId) => ({ id: tagId })) } }),
    },
    include: { tags: true },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const force = searchParams.get("force") === "true";
  const replacementImageId = searchParams.get("replacementImageId") || null;

  const existingImage = await prisma.image.findUnique({
    where: { id },
    include: { finding: true },
  });

  if (!existingImage || existingImage.userId !== session.user.id) {
    return NextResponse.json({ error: "Foto nicht gefunden." }, { status: 404 });
  }

  const finding = existingImage.finding;

  // Image is linked to a finding — need force flag to proceed
  if (finding && !force) {
    return NextResponse.json(
      {
        error: "linked",
        linkedFindings: [{ id: finding.id, name: finding.name }],
      },
      { status: 409 }
    );
  }

  // Handle replacement: link replacement image to the finding and set as thumbnail
  if (finding && replacementImageId) {
    await prisma.image.update({
      where: { id: replacementImageId },
      data: { findingId: finding.id },
    });
    await prisma.finding.update({
      where: { id: finding.id },
      data: { thumbnailId: replacementImageId },
    });
  } else if (finding) {
    // Force delete without replacement — clear thumbnailId if it pointed to this image
    if (finding.thumbnailId === id) {
      await prisma.finding.update({
        where: { id: finding.id },
        data: { thumbnailId: null },
      });
    }
  }

  const cldResponse = await cloudinary.uploader.destroy(existingImage.publicId);
  if (cldResponse?.result !== "ok" && cldResponse?.result !== "not found") {
    return NextResponse.json({ error: "Fehler in Cloudinary." }, { status: 500 });
  }

  await prisma.image.delete({ where: { id } });

  return NextResponse.json({ message: "Foto erfolgreich gelöscht." }, { status: 200 });
}
