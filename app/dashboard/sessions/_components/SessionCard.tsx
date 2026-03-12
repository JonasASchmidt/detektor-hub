"use client";

import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import {
  CalendarIcon,
  MapPinIcon,
  Pencil,
  ScanSearchIcon,
  ScrollText,
} from "lucide-react";
import Link from "next/link";
import type { Detector } from "@prisma/client";

interface SessionCardProps {
  id: string;
  name: string;
  description?: string | null;
  dateFrom: string | Date;
  dateTo?: string | Date | null;
  hasZone: boolean;
  findingCount: number;
  detector?: Detector | null;
}

export default function SessionCard({
  id,
  name,
  description,
  dateFrom,
  dateTo,
  hasZone,
  findingCount,
  detector,
}: SessionCardProps) {
  const from = new Date(dateFrom);
  const to = dateTo ? new Date(dateTo) : null;

  const dateLabel = to
    ? `${format(from, "dd.MM.yyyy", { locale: de })} – ${format(to, "dd.MM.yyyy", { locale: de })}`
    : format(from, "dd.MM.yyyy", { locale: de });

  return (
    <Card className="bg-white dark:bg-gray-900 border border-border px-5 py-4 flex flex-row items-start gap-4">
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-base truncate">{name}</p>
        {description && (
          <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
            {description}
          </p>
        )}
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <CalendarIcon className="w-3.5 h-3.5" />
            {dateLabel}
          </span>
          <span className="flex items-center gap-1">
            <ScanSearchIcon className="w-3.5 h-3.5" />
            {findingCount} {findingCount === 1 ? "Fund" : "Funde"}
          </span>
          {hasZone && (
            <span className="flex items-center gap-1">
              <MapPinIcon className="w-3.5 h-3.5" />
              Zone gesetzt
            </span>
          )}
          {detector && (
            <span className="flex items-center gap-1 truncate">
              {detector.company} {detector.name}
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-2 shrink-0 h-full justify-center">
        <Link
          href={`/dashboard/sessions/${id}`}
          className="flex items-center justify-center h-8 w-8 rounded-lg bg-[#F7F7F7] text-[#444] hover:bg-[#F0F0F0] border border-black/[0.03] transition-all hover:scale-[1.05] active:scale-[0.95]"
          title="Bearbeiten"
        >
          <Pencil className="h-[19px] w-[19px]" strokeWidth={1.2} />
        </Link>
        <Link
          href={`/dashboard/sessions/${id}/report`}
          className="flex items-center justify-center h-8 w-8 rounded-lg bg-[#F7F7F7] text-[#444] hover:bg-[#F0F0F0] border border-black/[0.03] transition-all hover:scale-[1.05] active:scale-[0.95]"
          title="Bericht"
        >
          <ScrollText className="h-[19px] w-[19px]" strokeWidth={1.2} />
        </Link>
      </div>
    </Card>
  );
}
