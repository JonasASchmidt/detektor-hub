import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import ZoneForm from "../_components/ZoneForm";

export default async function NewZonePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  return (
    <div className="px-4 pb-6 pt-12 md:px-10 md:pb-10 md:pt-16 max-w-[720px] mx-auto w-full">
      <ZoneForm />
    </div>
  );
}
