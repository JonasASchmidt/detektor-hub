import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import SessionForm from "../_components/SessionForm";

export default async function EditSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;

  const [rows, detectors, allFindings] = await Promise.all([
    prisma.$queryRaw<Array<Record<string, unknown>>>`
      SELECT
        id, name, description, "dateFrom", "dateTo",
        "detectorId", "userId", "createdAt", "updatedAt",
        ST_AsGeoJSON(zone) as zone
      FROM "FieldSession"
      WHERE id = ${id} AND "userId" = ${session.user.id}
    `,
    prisma.detector.findMany({ orderBy: [{ company: "asc" }, { name: "asc" }] }),
    prisma.finding.findMany({
      where: { userId: session.user.id },
      select: { id: true, name: true, foundAt: true, latitude: true, longitude: true, fieldSessionId: true },
      orderBy: { foundAt: "desc" },
    }),
  ]);

  if (!rows.length) notFound();

  const raw = rows[0];

  // Pre-select findings already linked to this session
  const linkedFindingIds = allFindings
    .filter((f) => f.fieldSessionId === id)
    .map((f) => f.id);

  return (
    <div className="px-6 pb-6 pt-12 md:px-10 md:pb-10 md:pt-16 max-w-[720px] mx-auto w-full">
      <SessionForm
        detectors={detectors}
        allFindings={allFindings}
        initialData={{
          id: raw.id as string,
          name: raw.name as string,
          description: raw.description as string | null,
          dateFrom: raw.dateFrom as string,
          dateTo: raw.dateTo as string | null,
          zone: raw.zone as string | null,
          detectorId: raw.detectorId as string | null,
          findingIds: linkedFindingIds,
        }}
      />
    </div>
  );
}
