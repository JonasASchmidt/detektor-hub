import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import SessionCard from "./_components/SessionCard";
import { cookies } from "next/headers";
import { ACTIVE_SESSION_COOKIE } from "@/app/api/active-session/route";

export default async function SessionsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const fieldSessions = await prisma.fieldSession.findMany({
    where: { userId: session.user.id },
    include: {
      detector: true,
      zone: { select: { id: true, name: true } },
      findings: { select: { id: true } },
    },
    orderBy: { dateFrom: "desc" },
  });

  const cookieStore = await cookies();
  const activeSessionId = cookieStore.get(ACTIVE_SESSION_COOKIE)?.value ?? null;

  return (
    <div className="px-6 pb-6 pt-12 md:px-10 md:pb-10 md:pt-16 space-y-3 max-w-[720px] mx-auto w-full">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold mb-0">Begehungen</h1>
        <Button
          asChild
          variant="ghost"
          className="h-8 border-2 border-foreground text-foreground hover:bg-[#2d2d2d] hover:text-white hover:border-[#2d2d2d] text-[14px] px-3 transition-all duration-150 ease-in-out"
        >
          <Link href="/dashboard/sessions/new">
            <Plus className="h-4 w-4" />
            Neue Begehung
          </Link>
        </Button>
      </div>

      {fieldSessions.length === 0 ? (
        <p className="text-muted-foreground text-sm pt-4">
          Noch keine Begehungen angelegt. Erstelle deine erste Begehung!
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {fieldSessions.map((s) => (
            <SessionCard
              key={s.id}
              id={s.id}
              name={s.name}
              description={s.description}
              dateFrom={s.dateFrom}
              dateTo={s.dateTo}
              zone={s.zone ?? null}
              findingCount={s.findings.length}
              detector={s.detector}
              isActive={s.id === activeSessionId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
