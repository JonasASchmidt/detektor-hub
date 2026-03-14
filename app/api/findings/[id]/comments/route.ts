import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

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

  const comment = await prisma.comment.create({
    data: {
      text: text.trim(),
      findingId: id,
      userId: session.user.id,
    },
    include: { user: true },
  });

  return NextResponse.json(comment, { status: 201 });
}
