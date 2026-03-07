"use client";

import { useState } from "react";
import { CldImage } from "next-cloudinary";
import { MapContainer, TileLayer } from "react-leaflet";
import { Marker } from "@adamscybot/react-leaflet-component-marker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { LocateFixedIcon } from "lucide-react";
import { FindingWithRelations } from "@/app/_types/FindingWithRelations.type";
import TagComponent from "@/components/tags/Tag";

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
          <div className="w-full h-56 mt-4">
            <CldImage
              src={finding.images[0].publicId}
              width={500}
              height={500}
              alt="Finding Thumbnail"
              className="w-full h-full object-cover rounded-lg"
            />
          </div>
        )}

        <MapContainer
          center={[finding.latitude, finding.longitude]}
          zoom={13}
          scrollWheelZoom={false}
          className="w-full h-full rounded-lg"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <Marker
            position={[finding.latitude, finding.longitude]}
            icon={<LocateFixedIcon />}
          />
        </MapContainer>
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
