import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Ensure the category exists before deleting
    const existingCategory = await prisma.tagCategory.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: "Kategorie nicht gefunden." },
        { status: 404 }
      );
    }

    // Delete the category
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
