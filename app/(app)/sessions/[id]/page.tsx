import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CalendarIcon,
  MapPinIcon,
  Pencil,
  ScanSearchIcon,
  TagIcon,
} from "lucide-react";
import { FindingStatus } from "@prisma/client";

import SessionDetailMap from "./_components/SessionDetailMap";
import TagComponent from "@/components/tags/Tag";

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;

  const [fieldSession, routeRows] = await Promise.all([
    prisma.fieldSession.findUnique({
      where: { id },
      include: {
        detector: true,
        zone: { select: { id: true, name: true } },
        findings: {
          select: {
            id: true,
            name: true,
            latitude: true,
            longitude: true,
            foundAt: true,
            status: true,
            tags: { select: { id: true, name: true, color: true, icon: true } },
          },
          orderBy: { foundAt: "asc" },
        },
      },
    }),
    prisma.$queryRaw<Array<{ routeGeoJson: string | null }>>`
      SELECT ST_AsGeoJSON(route) AS "routeGeoJson"
      FROM "FieldSession"
      WHERE id = ${id}
    `,
  ]);

  if (!fieldSession || fieldSession.userId !== session.user.id) notFound();

  const routeGeoJson = routeRows[0]?.routeGeoJson ?? null;
  const routeCoords: [number, number][] | null = routeGeoJson
    ? (JSON.parse(routeGeoJson) as { coordinates: [number, number][] }).coordinates
    : null;

  const from = new Date(fieldSession.dateFrom);
  const to = fieldSession.dateTo ? new Date(fieldSession.dateTo) : null;
  const dateLabel = to
    ? `${format(from, "dd.MM.yyyy", { locale: de })} – ${format(to, "dd.MM.yyyy", { locale: de })}`
    : format(from, "dd.MM.yyyy", { locale: de });

  const completedCount = fieldSession.findings.filter(
    (f) => f.status === FindingStatus.COMPLETED
  ).length;

  return (
    <div className="px-4 pb-10 pt-12 md:px-10 md:pt-16 max-w-[800px] mx-auto w-full space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-4xl font-bold truncate">{fieldSession.name}</h1>
          {fieldSession.description && (
            <p className="text-muted-foreground mt-1 text-sm">{fieldSession.description}</p>
          )}
        </div>
        <Button asChild variant="ghost" size="sm" className="shrink-0 border-2 border-foreground hover:bg-[#2d2d2d] hover:text-white hover:border-[#2d2d2d] transition-all">
          <Link href={`/sessions/${id}/edit`}>
            <Pencil className="h-4 w-4 mr-1" />
            Bearbeiten
          </Link>
        </Button>
      </div>

      {/* Meta */}
      <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <CalendarIcon className="h-4 w-4" />
          {dateLabel}
        </span>
        <span className="flex items-center gap-1.5">
          <ScanSearchIcon className="h-4 w-4" />
          {fieldSession.findings.length} Funde
          {completedCount > 0 && (
            <span className="text-xs text-muted-foreground">
              ({completedCount} abgeschlossen)
            </span>
          )}
        </span>
        {fieldSession.zone && (
          <Link
            href={`/zones/${fieldSession.zone.id}`}
            className="flex items-center gap-1.5 hover:text-foreground transition-colors"
          >
            <MapPinIcon className="h-4 w-4" />
            {fieldSession.zone.name}
          </Link>
        )}
        {fieldSession.detector && (
          <span className="flex items-center gap-1.5">
            {fieldSession.detector.company} {fieldSession.detector.name}
          </span>
        )}
        {fieldSession.namingScheme && (
          <span className="flex items-center gap-1.5">
            <TagIcon className="h-4 w-4" />
            Schema: <code className="bg-muted px-1 rounded text-xs">{fieldSession.namingScheme}</code>
          </span>
        )}
      </div>

      {/* Map */}
      {(fieldSession.findings.length > 0 || routeCoords) && (
        <SessionDetailMap
          findings={fieldSession.findings}
          routeCoords={routeCoords}
        />
      )}

      {/* Findings list */}
      {fieldSession.findings.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Funde</h2>
          <div className="flex flex-col gap-2">
            {fieldSession.findings.map((f) => (
              <Link
                key={f.id}
                href={`/findings/${f.id}`}
                className="flex items-center justify-between gap-3 px-4 py-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate text-sm">
                    {f.name ?? <span className="text-muted-foreground italic">Unbenannt</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(f.foundAt), "dd.MM.yyyy HH:mm", { locale: de })}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {f.tags.slice(0, 3).map((tag) => (
                    <TagComponent key={tag.id} tag={tag} compact />
                  ))}
                  <Badge variant={f.status === FindingStatus.COMPLETED ? "default" : "secondary"} className="text-[10px]">
                    {f.status === FindingStatus.COMPLETED ? "Fertig" : "Entwurf"}
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {fieldSession.findings.length === 0 && (
        <p className="text-sm text-muted-foreground">Noch keine Funde in dieser Begehung.</p>
      )}
    </div>
  );
}
