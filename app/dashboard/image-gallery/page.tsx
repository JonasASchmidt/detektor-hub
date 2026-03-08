"use client";

import ImageGallery from "@/components/image-gallery/ImageGallery";

export default function FindingsServer() {
  return (
    <div className="max-w-4xl mx-auto py-10 px-6 space-y-8">
      <h1 className="text-4xl font-bold">Foto-Galerie</h1>
      <ImageGallery />
    </div>
  );
}
