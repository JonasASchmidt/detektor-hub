"use client";

import { format } from "date-fns";
import Tag from "@/components/tags/Tag";
import { FindingWithRelations } from "@/app/_types/FindingWithRelations.type";
import { CldImage } from "next-cloudinary";

interface FindingCardProps {
  finding: FindingWithRelations;
}

export default function FindingCard({ finding }: FindingCardProps) {
  const formattedDate = format(new Date(finding.createdAt), "dd.MM.yyyy");

  return (
    <div className="flex items-center gap-4 p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800">
      <div className="w-16 h-16 flex-shrink-0 relative">
        {finding.images.length > 0 ? (
          <CldImage
            src={finding.images[0].publicId}
            width={64}
            height={64}
            crop="fill"
            gravity="auto"
            alt="Image"
            quality="3"
            format="auto"
            className="rounded-md object-cover w-full h-full"
          />
        ) : (
          <div className="w-full h-full bg-gray-300 flex items-center justify-center rounded-md">
            <span className="text-gray-500">No Image</span>
          </div>
        )}
      </div>

      <div className="flex-1">
        <div className="flex justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {finding.name}
          </h2>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            <p>{formattedDate}</p>
            <p>{finding.user.name ?? "anonymous"}</p>
          </div>
        </div>

        <div className="mt-1 flex flex-wrap gap-2">
          {finding.tags?.map((tag) => (
            <Tag key={tag.id} tag={tag} />
          ))}
        </div>

        <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
          {finding.description}
        </p>
      </div>
    </div>
  );
}
