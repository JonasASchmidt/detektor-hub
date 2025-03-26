"use client";

import { Card } from "@/components/ui/card";
import { Tag } from "@prisma/client";
import FindingsForm from "./FindingsForm";
import ImageGallery from "@/components/image-gallery/ImageGallery";

interface Props {
  tags: Tag[];
}

export default function FindingsPage({ tags }: Props) {
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
        Upload
        <ImageGallery />
      </Card>
      <Card className="bg-white dark:bg-gray-900">
        <FindingsForm tags={tags} />
      </Card>
    </div>
  );
}
