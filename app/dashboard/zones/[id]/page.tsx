import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import ZoneForm from "../_components/ZoneForm";

export default async function EditZonePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;

  const rows = await prisma.$queryRaw<
    Array<{
      id: string;
      name: string;
      description: string | null;
      geometryGeoJson: string | null;
    }>
  >`
    SELECT
      id, name, description,
      ST_AsGeoJSON(geometry) AS "geometryGeoJson"
    FROM "Zone"
    WHERE id = ${id} AND "userId" = ${session.user.id}
  `;

  if (!rows.length) notFound();

  const zone = rows[0];

  return (
    <div className="px-6 pb-6 pt-12 md:px-10 md:pb-10 md:pt-16 max-w-[720px] mx-auto w-full">
      <ZoneForm initialData={zone} />
    </div>
  );
}
