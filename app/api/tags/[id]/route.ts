import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const { replacementTagId } = await req.json().catch(() => ({}));

    // Check if tag is used in any findings
    const findingsWithTag = await prisma.finding.findMany({
      where: {
        tags: { some: { id } },
      },
      select: { id: true },
    });

    if (findingsWithTag.length > 0) {
      if (replacementTagId) {
        // Reassign findings to new tag
        const findingIds = findingsWithTag.map((f) => f.id);
        
        await prisma.$transaction([
          // Connect new tag to all these findings
          ...findingIds.map((findingId) =>
            prisma.finding.update({
              where: { id: findingId },
              data: {
                tags: {
                  connect: { id: replacementTagId },
                  disconnect: { id },
                },
              },
            })
          ),
          // Delete the old tag
          prisma.tag.delete({ where: { id } }),
        ]);
      } else {
        // Just delete the tag (links will be removed by Prisma automatically)
        await prisma.tag.delete({ where: { id } });
      }
    } else {
      // Not used anywhere, safe to delete
      await prisma.tag.delete({ where: { id } });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting tag:", error);
    return NextResponse.json(
      { error: "Error deleting tag" },
      { status: 500 }
    );
  }
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const findingsCount = await prisma.finding.count({
      where: {
        tags: { some: { id: params.id } },
      },
    });
    return NextResponse.json({ findingsCount });
  } catch (error) {
    return NextResponse.json({ error: "Error fetching tag info" }, { status: 500 });
  }
}
