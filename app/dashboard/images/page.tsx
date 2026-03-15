"use client";

import { useRef } from "react";
import ImageGallery, { ImageGalleryHandle } from "@/components/images/ImageGallery";
import { Button } from "@/components/ui/button";
import { UploadCloud } from "lucide-react";

export default function ImagesPage() {
  const galleryRef = useRef<ImageGalleryHandle>(null);

  return (
    <div className="px-6 pb-6 pt-12 md:px-10 md:pb-10 md:pt-16 space-y-3 max-w-[720px] mx-auto w-full">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold">Bilder</h1>
        <Button
          variant="ghost"
          className="h-8 border-2 border-foreground text-foreground hover:bg-[#2d2d2d] hover:text-white hover:border-[#2d2d2d] text-[14px] px-3 transition-all duration-150 ease-in-out"
          onClick={() => galleryRef.current?.triggerUpload()}
        >
          <UploadCloud className="h-4 w-4" />
          Fotos hochladen
        </Button>
      </div>
      <ImageGallery ref={galleryRef} />
    </div>
  );
}
