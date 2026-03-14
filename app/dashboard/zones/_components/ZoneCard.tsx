"use client";

import { Card } from "@/components/ui/card";
import { MapPinIcon, Pencil, ScanSearchIcon } from "lucide-react";
import Link from "next/link";

interface ZoneCardProps {
  id: string;
  name: string;
  description?: string | null;
  sessionCount: number;
  hasGeometry: boolean;
}

export default function ZoneCard({
  id,
  name,
  description,
  sessionCount,
  hasGeometry,
}: ZoneCardProps) {
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
            <ScanSearchIcon className="w-3.5 h-3.5" />
            {sessionCount} {sessionCount === 1 ? "Begehung" : "Begehungen"}
          </span>
          {hasGeometry && (
            <span className="flex items-center gap-1">
              <MapPinIcon className="w-3.5 h-3.5" />
              Polygon gesetzt
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2 shrink-0 justify-center">
        <Link
          href={`/dashboard/zones/${id}`}
          className="flex items-center justify-center h-8 w-8 rounded-lg bg-[#F7F7F7] text-[#444] hover:bg-[#F0F0F0] border border-black/[0.03] transition-all hover:scale-[1.05] active:scale-[0.95]"
          title="Bearbeiten"
        >
          <Pencil className="h-[19px] w-[19px]" strokeWidth={1.2} />
        </Link>
      </div>
    </Card>
  );
}
