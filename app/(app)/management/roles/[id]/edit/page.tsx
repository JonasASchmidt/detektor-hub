import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { hasCapability } from "@/lib/hasCapability";
import prisma from "@/lib/prisma";
import RoleForm from "../../_components/RoleForm";

interface Props {
  params: { id: string };
}

export default async function EditRolePage({ params }: Props) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  if (session.user.role !== "ADMIN" && session.user.role !== "OFFICIAL") {
    redirect("/findings");
  }

  const role = await prisma.officialRole.findUnique({
    where: { id: params.id },
    include: { scope: true },
  });
  if (!role) notFound();

  const isAdmin = session.user.role === "ADMIN";
  const canManage =
    isAdmin || (await hasCapability(session.user.id, "MANAGE_ROLES"));
  const isOwner = role.createdByUserId === session.user.id;

  // Only ADMIN or the role's creator may edit it
  if (!canManage || (!isAdmin && !isOwner)) redirect("/management/roles");

  return (
    <div className="px-6 pb-6 pt-12 md:px-10 md:pb-10 md:pt-16 space-y-6 max-w-[720px] mx-auto w-full">
      <h1 className="text-4xl font-bold">Rolle bearbeiten</h1>
      <RoleForm
        roleId={role.id}
        initialData={{
          name: role.name,
          description: role.description,
          badgeLabel: role.badgeLabel,
          badgeColor: role.badgeColor,
          priority: role.priority,
          capabilities: role.capabilities,
          scopes: role.scope.map((s) => ({
            adminUnitType: s.adminUnitType as "FEDERAL_STATE" | "COUNTY" | "MUNICIPALITY",
            adminUnitName: s.adminUnitName ?? "",
          })),
        }}
      />
    </div>
  );
}
