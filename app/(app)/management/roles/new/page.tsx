import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { hasCapability } from "@/lib/hasCapability";
import RoleForm from "../_components/RoleForm";

export default async function NewRolePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  if (session.user.role !== "ADMIN" && session.user.role !== "OFFICIAL") {
    redirect("/findings");
  }

  const isAdmin = session.user.role === "ADMIN";
  const canManage =
    isAdmin || (await hasCapability(session.user.id, "MANAGE_ROLES"));

  if (!canManage) redirect("/management/roles");

  return (
    <div className="px-6 pb-6 pt-12 md:px-10 md:pb-10 md:pt-16 space-y-6 max-w-[720px] mx-auto w-full">
      <h1 className="text-4xl font-bold">Neue Rolle</h1>
      <RoleForm />
    </div>
  );
}
