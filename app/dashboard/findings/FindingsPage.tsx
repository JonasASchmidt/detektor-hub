"use client";

import { Card } from "@/components/ui/card";
import { Tag } from "@prisma/client";
import FindingsForm from "./FindingsForm";
import ImageGallery from "@/components/image-gallery/ImageGallery";
import { Label } from "@/components/ui/label";
import { useState } from "react";

interface Props {
  tags: Tag[];
}

export default function FindingsPage({ tags }: Props) {
  const [images, setImages] = useState<string[]>([]);

  return (
    <div className="max-w-4xl mx-auto py-10 px-6 space-y-8">
      <header className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
          Funde
        </h1>
      </header>
      <p className="mt-2 text-md text-gray-600 dark:text-gray-400">
        Funde sind archäologische Objekte oder Artefakte, die bei Ausgrabungen
        oder Entdeckungen geborgen wurden. Sie dienen der wissenschaftlichen
        Erforschung und Dokumentation historischer Epochen. Jeder Fund kann mit
        mehreren Tags versehen werden, um eine präzise Kategorisierung und
        bessere Auffindbarkeit zu ermöglichen. Auf dieser Seite kannst du neue
        Funde anlegen oder bestehende verwalten.
      </p>
      <Card className="bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto py-4 px-6 space-y-4">
          <Label htmlFor="name">Fotos</Label>
          <p className="mt-2 text-md text-gray-600 dark:text-gray-400">
            Hier können dem Fund Bilder aus Ihrer Gallerie zugeordnet werden.
          </p>
          <ImageGallery selected={images} onSelect={setImages} />
        </div>
      </Card>
      <Card className="bg-white dark:bg-gray-900">
        <FindingsForm tags={tags} />
      </Card>
    </div>
  );
}
