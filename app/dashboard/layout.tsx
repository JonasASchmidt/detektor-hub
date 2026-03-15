import { AppSidebar } from "@/components/AppSidebar";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";
import { AppHeaderBar } from "@/components/AppHeaderBar";
import { cookies } from "next/headers";
import { ACTIVE_SESSION_COOKIE } from "@/app/api/active-session/route";
import prisma from "@/lib/prisma";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [session, cookieStore] = await Promise.all([
    getServerSession(authOptions),
    cookies(),
  ]);

  if (!session) {
    redirect("/login");
  }

  // Resolve active field session from cookie (non-blocking — fails gracefully)
  const activeSessionId = cookieStore.get(ACTIVE_SESSION_COOKIE)?.value;
  let activeSession: { id: string; name: string } | null = null;

  if (activeSessionId && session.user?.id) {
    try {
      const found = await prisma.fieldSession.findFirst({
        where: { id: activeSessionId, userId: session.user.id },
        select: { id: true, name: true },
      });
      activeSession = found ?? null;
    } catch {
      // Non-critical — header renders without active session indicator
    }
  }

  return (
    <SidebarProvider className="flex flex-col h-screen overflow-hidden">
      <AppHeaderBar activeSession={activeSession} />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <AppSidebar />
        <SidebarInset className="overflow-y-scroll overflow-x-hidden overscroll-none min-h-0">
          {children}
          <Toaster position="top-right" richColors offset={{ top: 16, right: 4, bottom: 16, left: 16 }} />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
