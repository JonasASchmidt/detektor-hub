import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const tags = await prisma.tag.findMany({
      include: { category: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(tags);
  } catch (error) {
    console.error("Error fetching tags:", error);
    return NextResponse.json({ error: "Error fetching tags" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { category, name, color, icon } = await req.json();

    if (!name) {
      return NextResponse.json(
        { error: "Der Name des Tags ist erforderlich." },
        { status: 400 }
      );
    }

    if (!color) {
      return NextResponse.json(
        { error: "Die Auswahl einer Farbe ist erforderlich." },
        { status: 400 }
      );
    }

    if (!icon) {
      return NextResponse.json(
        { error: "Die Auswahl eines Icons ist erforderlich." },
        { status: 400 }
      );
    }

    const existingTag = await prisma.tag.findUnique({
      where: { name },
    });

    if (existingTag) {
      return NextResponse.json(
        { error: "Dieser Tag existiert bereits." },
        { status: 400 }
      );
    }

    const tag = await prisma.tag.create({
      data: { category: { connect: { id: category } }, name, color, icon },
    });

    return NextResponse.json({ tag }, { status: 201 });
  } catch (error) {
    console.error("Fehler beim Erstellen des Tags:", error);
    return NextResponse.json(
      { error: "Fehler beim Erstellen des Tags." },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const { category, name, color, icon, id } = await req.json();

    if (!name) {
      return NextResponse.json(
        { error: "Der Name des Tags ist erforderlich." },
        { status: 400 }
      );
    }

    if (!color) {
      return NextResponse.json(
        { error: "Die Auswahl einer Farbe ist erforderlich." },
        { status: 400 }
      );
    }

    if (!icon) {
      return NextResponse.json(
        { error: "Die Auswahl eines Icons ist erforderlich." },
        { status: 400 }
      );
    }

    const existingTag = await prisma.tag.findUnique({
      where: { name, NOT: { id } },
    });

    if (existingTag) {
      return NextResponse.json(
        { error: "Dieser Tag existiert bereits." },
        { status: 400 }
      );
    }

    const tag = await prisma.tag.update({
      where: { id },
      data: { category: { connect: { id: category } }, name, color, icon },
    });

    return NextResponse.json({ tag }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Fehler beim Speichern des Tags." },
      { status: 500 }
    );
  }
}
