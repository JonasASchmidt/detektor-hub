import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { cookies } from "next/headers";

export const ACTIVE_SESSION_COOKIE = "dh_active_session";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ activeSession: null });
  }

  const cookieStore = await cookies();
  const sessionId = cookieStore.get(ACTIVE_SESSION_COOKIE)?.value;
  if (!sessionId) return NextResponse.json({ activeSession: null });

  const fieldSession = await prisma.fieldSession.findFirst({
    where: { id: sessionId, userId: session.user.id },
    select: { id: true, name: true, namingScheme: true },
  });

  return NextResponse.json({ activeSession: fieldSession ?? null });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sessionId } = await req.json();

  // Verify the session belongs to the user
  const fieldSession = await prisma.fieldSession.findFirst({
    where: { id: sessionId, userId: session.user.id },
    select: { id: true, name: true, namingScheme: true },
  });

  if (!fieldSession) {
    return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });
  }

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_SESSION_COOKIE, fieldSession.id, {
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });

  return NextResponse.json({ activeSession: fieldSession });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(ACTIVE_SESSION_COOKIE);
  return NextResponse.json({ activeSession: null });
}
