import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { notFound } from "next/navigation";
import CollectionForm from "../../_components/CollectionForm";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditCollectionPage({ params }: Props) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  const collection = await prisma.collection.findUnique({
    where: { id },
    select: { id: true, name: true, description: true, userId: true },
  });

  if (!collection || collection.userId !== session?.user?.id) notFound();

  return (
    <div className="px-6 pb-10 pt-12 md:px-10 md:pt-16 max-w-[560px] mx-auto w-full space-y-6">
      <h1 className="text-3xl font-bold">Sammlung bearbeiten</h1>
      <CollectionForm
        collectionId={collection.id}
        initialName={collection.name}
        initialDescription={collection.description ?? ""}
      />
    </div>
  );
}
