"use client";

import ImageGallery from "@/components/image-gallery/ImageGallery";

export default function FindingsServer() {
  return (
    <div className="px-6 pb-6 pt-12 md:px-10 md:pb-10 md:pt-16 space-y-3 max-w-[720px] mx-auto w-full">
      <h1 className="text-4xl font-bold">Foto-Galerie</h1>
      <ImageGallery />
    </div>
  );
}
