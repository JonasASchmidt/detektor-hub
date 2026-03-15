"use client";

import dynamic from "next/dynamic";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const FindingDetailMap = dynamic(() => import("./FindingDetailMap"), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-muted animate-pulse rounded-lg" />,
});

interface Props {
  open: boolean;
  onClose: () => void;
  latitude: number;
  longitude: number;
  county?: string | null;
  name?: string | null;
}

export default function FindingLocationDialog({ open, onClose, latitude, longitude, county, name }: Props) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[520px] p-0 overflow-hidden rounded-xl">
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle className="text-base font-bold">{name ?? "Fundort"}</DialogTitle>
        </DialogHeader>
        <div className="h-[300px]">
          <FindingDetailMap latitude={latitude} longitude={longitude} />
        </div>
        <div className="px-5 py-3 text-sm text-muted-foreground flex items-center gap-3">
          <span className="font-mono text-xs">{latitude.toFixed(6)}, {longitude.toFixed(6)}</span>
          {county && (
            <>
              <span className="text-muted-foreground/40">·</span>
              <span>{county}</span>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
