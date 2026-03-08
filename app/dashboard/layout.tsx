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

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex flex-col h-screen">
      <AppHeaderBar />
      <SidebarProvider
        className="flex-1 overflow-hidden"
        style={
          {
            "--sidebar-height": "calc(100vh - 60px)",
          } as React.CSSProperties
        }
      >
        <AppSidebar />
        <SidebarInset>
          {children}
          <Toaster position="top-right" richColors />
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
