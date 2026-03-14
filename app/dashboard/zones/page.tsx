import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import ZoneCard from "./_components/ZoneCard";

export default async function ZonesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const zones = await prisma.$queryRaw<
    Array<{
      id: string;
      name: string;
      description: string | null;
      geometryGeoJson: string | null;
      sessionCount: bigint;
    }>
  >`
    SELECT
      z.id,
      z.name,
      z.description,
      ST_AsGeoJSON(z.geometry) AS "geometryGeoJson",
      COUNT(fs.id) AS "sessionCount"
    FROM "Zone" z
    LEFT JOIN "FieldSession" fs ON fs."zoneId" = z.id
    WHERE z."userId" = ${session.user.id}
    GROUP BY z.id
    ORDER BY z."createdAt" DESC
  `;

  return (
    <div className="px-6 pb-6 pt-12 md:px-10 md:pb-10 md:pt-16 space-y-3 max-w-[720px] mx-auto w-full">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold mb-0">Zonen</h1>
        <Button
          asChild
          variant="ghost"
          className="h-8 border-2 border-foreground text-foreground hover:bg-[#2d2d2d] hover:text-white hover:border-[#2d2d2d] text-[14px] px-3 transition-all duration-150 ease-in-out"
        >
          <Link href="/dashboard/zones/new">
            <Plus className="h-4 w-4" />
            Neue Zone
          </Link>
        </Button>
      </div>

      {zones.length === 0 ? (
        <p className="text-muted-foreground text-sm pt-4">
          Noch keine Zonen angelegt. Erstelle deine erste Zone!
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {zones.map((z) => (
            <ZoneCard
              key={z.id}
              id={z.id}
              name={z.name}
              description={z.description}
              sessionCount={Number(z.sessionCount)}
              hasGeometry={!!z.geometryGeoJson}
            />
          ))}
        </div>
      )}
    </div>
  );
}
