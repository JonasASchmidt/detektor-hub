import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

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
