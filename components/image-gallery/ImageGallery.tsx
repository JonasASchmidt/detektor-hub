"use client";

import { Photo } from "@prisma/client";
import { useEffect, useState } from "react";
import { Input } from "../ui/input";
import { Card, CardContent } from "../ui/card";
import { CldImage, CldUploadWidget } from "next-cloudinary";
import { Button } from "../ui/button";

export default function ImageGallery() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>();

  useEffect(() => {
    fetch("/api/user-photos")
      .then((res) => res.json())
      .then(setPhotos);
  }, []);

  const handleUpload = async (cloudinaryResponse: any) => {
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

  return (
    <div className="max-w-4xl mx-auto py-10 px-6 space-y-8">
      <header className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
          Foto-Gallerie
        </h1>
      </header>
      <div className="space-y-4">
        <div className="flex gap-4 items-center">
          <Input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          <CldUploadWidget
            uploadPreset="detektor-hud-preset"
            onSuccess={(res) => handleUpload(res)}
            onError={(error: any) => {
              console.error("Upload failed:", error);
            }}
          >
            {({ open }) => <Button onClick={() => open()}>Upload Image</Button>}
          </CldUploadWidget>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo) => (
            <Card
              key={photo.id}
              onClick={() =>
                setSelected((prev) =>
                  prev.includes(photo.id)
                    ? prev.filter((id) => id !== photo.id)
                    : [...prev, photo.id]
                )
              }
              className={`cursor-pointer transition ${
                selected.includes(photo.id) ? "ring-2 ring-blue-500" : ""
              }`}
            >
              <CardContent className="p-2">
                <CldImage
                  src={photo.publicId}
                  width={200}
                  height={200}
                  crop="fill"
                  gravity="auto"
                  alt="Photo"
                  quality="auto"
                  format="auto"
                />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
