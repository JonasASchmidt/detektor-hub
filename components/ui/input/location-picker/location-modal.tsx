"use client";

import { useState } from "react";
import type { LatLng, LatLngLiteral } from "leaflet";
import dynamic from "next/dynamic";

const SimpleMap = dynamic(() => import("@/components/map/simple-map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] bg-muted animate-pulse rounded-lg" />
  ),
});
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../dialog";
import { Button } from "../../button";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (value?: LatLngLiteral) => void;
  value?: LatLngLiteral;
}

export default function LocationModal({
  isOpen,
  onClose,
  onSubmit,
  value,
}: Props) {
  const [location, setLocation] = useState<LatLng | undefined>(
    value ? ({ lat: value.lat, lng: value.lng } as LatLng) : undefined
  );

  const handleSubmit = () => {
    onSubmit(location);
  };

  const bodyContent = (
    <div className="flex flex-col gap-4">
      <SimpleMap
        center={location ? [location?.lat, location?.lng] : undefined}
        onClick={setLocation}
      />
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Position wählen</DialogTitle>
          <DialogDescription>
            Klicke auf die Karte um die Position auszuwählen.
          </DialogDescription>
        </DialogHeader>
        {bodyContent}
        <DialogFooter>
          <Button className="w-full" onClick={handleSubmit}>
            Bestätigen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
