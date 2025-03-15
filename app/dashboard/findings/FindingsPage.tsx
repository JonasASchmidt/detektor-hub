"use client";

import { Card } from "@/components/ui/card";
import { Tag } from "@prisma/client";
import { CldImage, CldUploadWidget } from "next-cloudinary";
import { useState } from "react";
import FindingsForm from "./FindingsForm";

interface Props {
  tags: Tag[];
}

export default function FindingsPage({ tags }: Props) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

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
        <CldUploadWidget
          uploadPreset="detektor-hud-preset"
          onSuccess={(result: any) => {
            if (result.event === "success") {
              setImageUrl(result.info.secure_url);
            }
          }}
          onError={(error: any) => {
            console.error("Upload failed:", error);
          }}
        >
          {({ open }) => (
            <button
              onClick={() => open()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-md hover:bg-blue-700"
            >
              Upload Image
            </button>
          )}
        </CldUploadWidget>
        {imageUrl && (
          <CldImage
            width="50"
            height="50"
            src={imageUrl}
            sizes="100vw"
            alt="Turtle"
          />
        )}
      </Card>
      <Card className="bg-white dark:bg-gray-900">
        <FindingsForm tags={tags} />
      </Card>
    </div>
  );
}
