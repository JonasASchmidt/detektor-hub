import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { UsersIcon } from "lucide-react";

export default async function ManagementUsersPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN" && session.user.role !== "OFFICIAL") {
    redirect("/findings");
  }

  return (
    <div className="px-6 pb-6 pt-12 md:px-10 md:pb-10 md:pt-16 space-y-6 max-w-[720px] mx-auto w-full">
      <div className="flex items-center gap-3">
        <UsersIcon className="h-7 w-7 shrink-0" />
        <h1 className="text-4xl font-bold">Benutzer</h1>
      </div>
      <p className="text-muted-foreground">
        Benutzerverwaltung — wird in Kürze implementiert.
      </p>
    </div>
  );
}
