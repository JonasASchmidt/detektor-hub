"use client";

import { Photo } from "@prisma/client";
import { useEffect, useState } from "react";
import {
  CldUploadWidget,
  CloudinaryUploadWidgetError,
  CloudinaryUploadWidgetResults,
} from "next-cloudinary";
import { Button } from "../ui/button";
import ImageCard from "./ImageCard";
import { ClockArrowDown, ClockArrowUp, UploadCloud } from "lucide-react";

interface Props {
  onSelect?: (ids: string[]) => void;
  selected?: string[];
}

export default function ImageGallery({ onSelect, selected }: Props) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [sort, setSort] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    fetch("/api/user-photos")
      .then((res) => res.json())
      .then(setPhotos);
  }, []);

  const handleDelete = (id: string) =>
    setPhotos(photos.filter((photo) => photo.id !== id));

  const handleSelect = (imageId: string) => {
    if (!onSelect) {
      return;
    }

    if (selected?.includes(imageId)) {
      return onSelect(selected.filter((id) => id !== imageId));
    }

    if (!selected) {
      return [imageId];
    }

    return onSelect([...selected, imageId]);
  }

  const handleUpload = async (
    cloudinaryResponse: CloudinaryUploadWidgetResults
  ) => {
    if (
      !cloudinaryResponse.info ||
      typeof cloudinaryResponse.info == "string"
    ) {
      return;
    }

    const res = await fetch("/api/photos", {
      method: "POST",
      body: JSON.stringify({
        url: cloudinaryResponse.info.secure_url,
        publicId: cloudinaryResponse.info.public_id,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const newPhoto = await res.json();
    setPhotos((prev) => [...prev, newPhoto]);
  };

  const filteredPhotos = photos.sort((a, b) => {
    const aDate = new Date(a.createdAt).getTime();
    const bDate = new Date(b.createdAt).getTime();
    return sort === "desc" ? bDate - aDate : aDate - bDate;
  });

  return (
    <>
      <div className="flex gap-4 items-center">
        <CldUploadWidget
          uploadPreset="detektor-hud-preset"
          onSuccess={(res) => handleUpload(res)}
          onError={(error: CloudinaryUploadWidgetError) => {
            console.error("Upload failed:", error);
          }}
        >
          {({ open }) => (
            <Button
              className="bg-gradient-to-r w-full from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-lg hover:brightness-110"
              onClick={() => open()}
            >
              <UploadCloud />
              Fotos hochladen
            </Button>
          )}
        </CldUploadWidget>
      </div>
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex gap-2">
          <Button
            variant={sort === "desc" ? "default" : "outline"}
            onClick={() => setSort("desc")}
          >
            <ClockArrowDown />
            Neueste zuerst
          </Button>
          <Button
            variant={sort === "asc" ? "default" : "outline"}
            onClick={() => setSort("asc")}
          >
            <ClockArrowUp />
            Älteste zuerst
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredPhotos.map((photo) => (
          <ImageCard
            key={photo.id}
            isSelected={selected?.includes(photo.id) ?? false}
            onClick={handleSelect}
            onDelete={handleDelete}
            photo={photo}
          />
        ))}
      </div>
    </>
  );
}
