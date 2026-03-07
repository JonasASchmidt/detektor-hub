import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import cloudinary from "@/lib/cloudinary";

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const existingImage = await prisma.image.findUnique({
    where: { id },
    include: {
      finding: true,
    },
  });

  if (!existingImage) {
    return NextResponse.json(
      { error: "Foto nicht gefunden." },
      { status: 404 }
    );
  }

  const finding = existingImage?.finding;
  if (finding) {
    return NextResponse.json(
      {
        error:
          "Foto kann nicht gelöscht werden, da es einem Fund zugeordnet ist.",
      },
      { status: 404 }
    );
  }

  const cldResponse = await cloudinary.uploader.destroy(existingImage.publicId);

  console.log({ cldResponse });

  if (cldResponse?.result !== "ok" && cldResponse?.result !== "not found") {
    return NextResponse.json(
      {
        error: "Fehler in Cloudinary.",
      },
      { status: 404 }
    );
  }

  await prisma.image.delete({ where: { id } });

  return NextResponse.json(
    { message: "Foto erfolgreich gelöscht." },
    { status: 200 }
  );
}
