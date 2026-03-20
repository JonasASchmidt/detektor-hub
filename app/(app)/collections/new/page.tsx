import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import CollectionForm from "../_components/CollectionForm";

export default async function NewCollectionPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  return (
    <div className="px-4 pb-10 pt-12 md:px-10 md:pt-16 max-w-[560px] mx-auto w-full space-y-6">
      <h1 className="text-3xl font-bold">Neue Sammlung</h1>
      <CollectionForm />
    </div>
  );
}
