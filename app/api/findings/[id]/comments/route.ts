import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { logActivity } from "@/lib/activityLog";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { text } = await req.json();

  if (!text?.trim()) {
    return NextResponse.json({ error: "Text erforderlich." }, { status: 400 });
  }

  if (text.trim().length > 5000) {
    return NextResponse.json({ error: "Kommentar zu lang (max. 5000 Zeichen)." }, { status: 400 });
  }

  // Allow comments on own findings (any status) or completed findings of others
  const finding = await prisma.finding.findUnique({ where: { id }, select: { status: true, userId: true } });
  const isOwner = finding?.userId === session.user.id;
  if (!finding || (finding.status !== "COMPLETED" && !isOwner)) {
    return NextResponse.json({ error: "Fund nicht gefunden." }, { status: 404 });
  }

  try {
    const comment = await prisma.comment.create({
      data: {
        text: text.trim(),
        findingId: id,
        userId: session.user.id,
      },
      include: { user: true },
    });

    await logActivity({
      userId: session.user.id,
      action: "comment.create",
      entityType: "comment",
      entityId: comment.id,
      entityOwnerId: finding.userId,
      metadata: { findingId: id },
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (err) {
    console.error("[comments POST]", err);
    return NextResponse.json({ error: "Datenbankfehler." }, { status: 500 });
  }
}
