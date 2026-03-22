import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { notFound } from "next/navigation";
import CollectionDetail from "../_components/CollectionDetail";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CollectionDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  const collection = await prisma.collection.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, image: true } },
      findings: {
        include: {
          images: true,
          tags: true,
          user: true,
          comments: { include: { user: true } },
        },
        orderBy: { foundAt: "desc" },
      },
      _count: { select: { findings: true } },
    },
  });

  if (!collection) notFound();

  const isOwner = session?.user?.id === collection.userId;

  return <CollectionDetail collection={collection} isOwner={isOwner} />;
}
