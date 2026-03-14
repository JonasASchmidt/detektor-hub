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

  const [fieldSession, detectors, allFindings] = await Promise.all([
    prisma.fieldSession.findUnique({
      where: { id },
      include: { findings: { select: { id: true } } },
    }),
    prisma.detector.findMany({ orderBy: [{ company: "asc" }, { name: "asc" }] }),
    prisma.finding.findMany({
      where: { userId: session.user.id },
      select: { id: true, name: true, foundAt: true, latitude: true, longitude: true, fieldSessionId: true },
      orderBy: { foundAt: "desc" },
    }),
  ]);

  if (!fieldSession || fieldSession.userId !== session.user.id) notFound();

  const linkedFindingIds = fieldSession.findings.map((f) => f.id);

  return (
    <div className="px-6 pb-6 pt-12 md:px-10 md:pb-10 md:pt-16 max-w-[720px] mx-auto w-full">
      <SessionForm
        detectors={detectors}
        allFindings={allFindings}
        initialData={{
          id: fieldSession.id,
          name: fieldSession.name,
          description: fieldSession.description,
          dateFrom: fieldSession.dateFrom,
          dateTo: fieldSession.dateTo,
          zoneId: fieldSession.zoneId,
          detectorId: fieldSession.detectorId,
          findingIds: linkedFindingIds,
        }}
      />
    </div>
  );
}
