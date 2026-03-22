import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const { action, ids, folder } = await req.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "No IDs provided" }, { status: 400 });
    }

    if (action === "delete") {
      await prisma.image.deleteMany({
        where: {
          id: { in: ids },
          userId,
        },
      });
      return NextResponse.json({ success: true });
    }

    if (action === "move") {
      if (!folder) {
        return NextResponse.json({ error: "No folder provided" }, { status: 400 });
      }

      await prisma.image.updateMany({
        where: {
          id: { in: ids },
          userId,
        },
        data: {
          folder: folder,
        },
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Bulk action failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
