import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { name } = await req.json();

    if (!name) {
      return NextResponse.json(
        { error: "Der Name der Kategorie ist erforderlich." },
        { status: 400 }
      );
    }

    // Check if category already exists
    const existingCategory = await prisma.tagCategory.findUnique({
      where: { name },
    });

    if (existingCategory) {
      return NextResponse.json(
        { error: "Diese Kategorie existiert bereits." },
        { status: 400 }
      );
    }

    // Create new category
    const category = await prisma.tagCategory.create({ data: { name } });

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error("Fehler beim Erstellen der Kategorie:", error);
    return NextResponse.json(
      { error: "Fehler beim Erstellen der Kategorie." },
      { status: 500 }
    );
  }
}
