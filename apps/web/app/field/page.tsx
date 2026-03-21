import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { cookies } from "next/headers";
import { ACTIVE_SESSION_COOKIE } from "@/app/api/active-session/route";
import FieldPageClient from "./_components/FieldPageClient";

export default async function FieldPage() {
  const [session, cookieStore] = await Promise.all([
    getServerSession(authOptions),
    cookies(),
  ]);

  const userId = session!.user!.id!;

  // Open sessions = dateTo is null (not yet finished)
  const openSessions = await prisma.fieldSession.findMany({
    where: { userId, dateTo: null },
    select: { id: true, name: true, namingScheme: true, dateFrom: true },
    orderBy: { dateFrom: "desc" },
  });

  // Resolve active session from cookie
  const activeSessionId = cookieStore.get(ACTIVE_SESSION_COOKIE)?.value ?? null;
  const activeSession = activeSessionId
    ? (openSessions.find((s) => s.id === activeSessionId) ?? null)
    : null;

  return (
    <FieldPageClient
      openSessions={openSessions}
      initialActiveSession={activeSession}
    />
  );
}
