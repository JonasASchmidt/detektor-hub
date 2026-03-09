"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { CldImage } from "next-cloudinary";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { FindingWithRelations } from "@/app/_types/FindingWithRelations.type";
import TagComponent from "@/components/tags/Tag";

const FindingDetailMap = dynamic(() => import("./FindingDetailMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-muted animate-pulse rounded-lg" />
  ),
});

interface Props {
  finding: FindingWithRelations;
}

export default function FindingDetail({ finding }: Props) {
  const [commentText, setCommentText] = useState("");

  const handleCommentSubmit = async () => {
    // Logic to submit the comment to the backend.
    // This could be a POST request to an API route.
  };

  if (!finding) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-full p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">{finding.name}</h1>
        <div className="text-sm text-gray-500">
          <p>Found on: {format(new Date(finding.createdAt), "dd.MM.yyyy")}</p>
          <p>By: {finding.user.name}</p>
        </div>
        <p className="text-gray-700">{finding.description}</p>
        <div className="flex gap-1">
          {finding.tags.map((tag) => (
            <TagComponent key={`tag_${tag.id}`} tag={tag} />
          ))}
        </div>

        {finding.images.length > 0 && (
          <div className="mt-4 space-y-6">
            {finding.images.map((image, index) => (
              <div key={image.id} className="space-y-2">
                <a
                  href={`https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/${image.publicId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block cursor-zoom-in"
                >
                  <CldImage
                    src={image.publicId}
                    width={1200}
                    height={900}
                    alt={image.title || `Bild ${index + 1}`}
                    className="w-full max-h-[80vh] object-contain rounded-xl bg-muted"
                  />
                </a>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  {image.originalFilename && (
                    <span>{image.originalFilename}</span>
                  )}
                  <span>{format(new Date(image.createdAt), "dd.MM.yyyy, HH:mm")} Uhr</span>
                  {image.fileSize && (
                    <span>
                      {image.fileSize < 1024 * 1024
                        ? `${(image.fileSize / 1024).toFixed(1)} KB`
                        : `${(image.fileSize / (1024 * 1024)).toFixed(1)} MB`}
                    </span>
                  )}
                  {image.width && image.height && (
                    <span>{image.width} × {image.height} px</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <FindingDetailMap
          latitude={finding.latitude}
          longitude={finding.longitude}
        />
      </div>
      <div className="col-span-1 space-y-2">
        <h2 className="text-xl font-semibold">Informationen zum Fund</h2>
        <h3>Beschreibung Rückseite</h3>
        <p>{finding.description_back}</p>
        <h3>Beschreibung Vorderseite</h3>
        <p>{finding.description_front}</p>
        <p>Durchmesser: {finding.diameter}cm</p>
        <p>Gewicht: {finding.weight}g</p>
        <h2 className="text-xl font-semibold">Datierung</h2>
        Geschätzte Datierung: {finding.dating_from} - {finding.dating_to}
        <p>{finding.dating}</p>
        <h2 className="text-xl font-semibold">Weitere Informationen</h2>
        <p>{finding.references}</p>
      </div>
      <div className="col-span-1">
        <h2 className="text-xl font-semibold">Comments</h2>

        <div className="space-y-4 mt-2">
          <p>No comments yet.</p>
        </div>

        <div className="mt-2">
          <Label htmlFor="comment">Add a comment</Label>
          <Input
            id="comment"
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Write your comment..."
            className="w-full mt-2"
          />
          <Button
            onClick={handleCommentSubmit}
            disabled={!commentText}
            className="mt-4"
          >
            Submit Comment
          </Button>
        </div>
      </div>
    </div>
  );
}
