"use client";

import { format } from "date-fns";
import Tag from "@/components/tags/Tag";
import { FindingWithRelations } from "@/app/_types/FindingWithRelations.type";
import { CldImage } from "next-cloudinary";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { EyeIcon, PencilIcon } from "lucide-react";

interface FindingCardProps {
  finding: FindingWithRelations;
}

export default function FindingCard({ finding }: FindingCardProps) {
  const router = useRouter();

  const formattedDate = format(new Date(finding.createdAt), "dd.MM.yyyy");

  const handleClick = () => router.push(`findings/${finding.id}`);

  const handleClickEdit = () => router.push(`findings/${finding.id}/edit`);

  return (
    <div className="flex gap-4 p-4 border rounded-xl bg-white dark:bg-gray-900 hover:shadow-lg transition">
      {/* Image */}
      <div className="w-24 h-24 flex-shrink-0 relative">
        {finding.images.length > 0 ? (
          <CldImage
            src={finding.images[0].publicId}
            width={256}
            height={256}
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

      <div className="flex flex-1 flex-col">
        <div className="flex justify-between">
          <div className="flex flex-col">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {finding.name}
              </h2>
              <div className="flex gap-2 text-sm text-gray-500 dark:text-gray-400">
                <p>{formattedDate}</p>
                <span>•</span>
                <p>{finding.user?.name ?? "Anonymous"}</p>
              </div>
            </div>

            <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
              {finding.description}
            </p>

            <div className="mt-2 flex flex-wrap gap-2">
              {finding.tags?.map((tag) => (
                <Tag key={tag.id} tag={tag} />
              ))}
            </div>
          </div>

          <div className="flex flex-col items-center gap-2 ml-4">
            <Button onClick={handleClick} size="sm">
              <EyeIcon className="w-4 h-4" />
            </Button>
            <Button onClick={handleClickEdit} size="sm" disabled>
              <PencilIcon className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
