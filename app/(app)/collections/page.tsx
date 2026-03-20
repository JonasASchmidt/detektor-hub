import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import CollectionCard from "./_components/CollectionCard";

export default async function CollectionsPage() {
  const session = await getServerSession(authOptions);

  const collections = await prisma.collection.findMany({
    include: {
      user: { select: { id: true, name: true, image: true } },
      findings: {
        take: 1,
        select: { images: { take: 1, select: { publicId: true } } },
      },
      _count: { select: { findings: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const myCollections = collections.filter((c) => c.userId === session?.user?.id);
  const otherCollections = collections.filter((c) => c.userId !== session?.user?.id);

  return (
    <div className="px-4 pb-10 pt-12 md:px-10 md:pt-16 max-w-[960px] mx-auto w-full space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Sammlungen</h1>
        {session && (
          <Button asChild size="sm" className="font-bold">
            <Link href="/collections/new">
              <Plus className="h-4 w-4" />
              Neue Sammlung
            </Link>
          </Button>
        )}
      </div>

      {myCollections.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Meine Sammlungen
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {myCollections.map((c) => (
              <CollectionCard key={c.id} collection={c} isOwner />
            ))}
          </div>
        </section>
      )}

      {otherCollections.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Alle Sammlungen
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {otherCollections.map((c) => (
              <CollectionCard key={c.id} collection={c} isOwner={false} />
            ))}
          </div>
        </section>
      )}

      {collections.length === 0 && (
        <div className="text-center py-20 text-muted-foreground space-y-3">
          <p className="text-lg">Noch keine Sammlungen vorhanden.</p>
          {session && (
            <Button asChild variant="outline">
              <Link href="/collections/new">Erste Sammlung erstellen</Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
