import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getMobileSession } from "@/lib/mobile-auth";

/**
 * GET /api/mobile/sessions
 *
 * Returns all field sessions for the authenticated user, ordered newest first.
 * Authenticated via Authorization: Bearer <token>.
 */
export async function GET(req: NextRequest) {
  const session = await getMobileSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const fieldSessions = await prisma.fieldSession.findMany({
    where: { userId: session.id },
    include: {
      detector: true,
      zone: { select: { id: true, name: true } },
      findings: { select: { id: true } },
    },
    orderBy: { dateFrom: "desc" },
  });

  return NextResponse.json({ fieldSessions });
}
