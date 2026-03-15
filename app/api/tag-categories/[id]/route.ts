import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { name } = await req.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "Name erforderlich." }, { status: 400 });
  }
  try {
    const category = await prisma.tagCategory.update({
      where: { id },
      data: { name: name.trim() },
    });
    return NextResponse.json({ category });
  } catch {
    return NextResponse.json({ error: "Fehler beim Speichern." }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Ensure the category exists before deleting
    const existingCategory = await prisma.tagCategory.findUnique({
      where: { id },
      include: {
        tags: true,
      },
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: "Kategorie nicht gefunden." },
        { status: 404 }
      );
    }

    // Delete all tags in the category first, then the category
    await prisma.tag.deleteMany({ where: { categoryId: id } });
    await prisma.tagCategory.delete({ where: { id } });

    return NextResponse.json(
      { message: "Kategorie erfolgreich gelöscht." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Fehler beim Löschen der Kategorie:", error);
    return NextResponse.json(
      { error: "Fehler beim Löschen der Kategorie." },
      { status: 500 }
    );
  }
}
