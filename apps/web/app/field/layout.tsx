import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";

export const metadata = {
  title: "Felderfassung – Detektorhub",
};

export default async function FieldLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <div className="h-dvh bg-background flex flex-col overflow-hidden">
      {children}
      <Toaster position="top-center" richColors />
    </div>
  );
}
