"use client";

import ImageGallery from "@/components/image-gallery/ImageGallery";

export default function FindingsServer() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-4xl font-bold">Foto-Galerie</h1>
      <ImageGallery />
    </div>
  );
}
