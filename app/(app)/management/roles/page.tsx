import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { hasCapability } from "@/lib/hasCapability";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { PlusIcon, BadgeIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import RolesList from "./_components/RolesList";

export default async function ManagementRolesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  if (session.user.role !== "ADMIN" && session.user.role !== "OFFICIAL") {
    redirect("/findings");
  }

  const isAdmin = session.user.role === "ADMIN";
  const canManage =
    isAdmin || (await hasCapability(session.user.id, "MANAGE_ROLES"));

  const roles = canManage
    ? await prisma.officialRole.findMany({
        where: isAdmin ? undefined : { createdByUserId: session.user.id },
        include: {
          scope: true,
          _count: { select: { userRoles: true } },
        },
        orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      })
    : [];

  return (
    <div className="px-6 pb-6 pt-12 md:px-10 md:pb-10 md:pt-16 space-y-6 max-w-[720px] mx-auto w-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BadgeIcon className="h-7 w-7 shrink-0" />
          <h1 className="text-4xl font-bold">Rollen</h1>
        </div>
        {canManage && (
          <Button
            asChild
            variant="ghost"
            className="h-8 border-2 border-foreground hover:bg-[#2d2d2d] hover:text-white hover:border-[#2d2d2d] text-[14px] px-3 transition-all duration-150 ease-in-out"
          >
            <Link href="/management/roles/new">
              <PlusIcon className="h-4 w-4" />
              Neue Rolle
            </Link>
          </Button>
        )}
      </div>

      {!canManage ? (
        <p className="text-muted-foreground text-sm">
          Du benötigst die Berechtigung „Rollen verwalten", um Rollen zu verwalten.
        </p>
      ) : (
        <RolesList
          roles={roles}
          currentUserId={session.user.id}
          isAdmin={isAdmin}
        />
      )}
    </div>
  );
}
