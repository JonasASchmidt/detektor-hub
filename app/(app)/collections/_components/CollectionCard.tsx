"use client";

import Link from "next/link";
import { CldImage } from "next-cloudinary";
import { FolderOpen } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/initials";

type CollectionCardData = {
  id: string;
  name: string;
  description: string | null;
  user: { id: string; name: string | null; image: string | null };
  findings: { images: { publicId: string }[] }[];
  _count: { findings: number };
};

interface Props {
  collection: CollectionCardData;
  isOwner: boolean;
}

export default function CollectionCard({ collection }: Props) {
  const coverPublicId = collection.findings[0]?.images[0]?.publicId ?? null;

  return (
    <Link
      href={`/collections/${collection.id}`}
      className="group block rounded-xl border-2 border-black/[0.06] overflow-hidden hover:border-black/20 transition-colors bg-card"
    >
      {/* Cover image or placeholder */}
      <div className="h-36 bg-muted relative overflow-hidden">
        {coverPublicId ? (
          <CldImage
            src={coverPublicId}
            width={480}
            height={144}
            crop="fill"
            gravity="auto"
            alt={collection.name}
            format="auto"
            quality="auto"
            className="w-full h-full object-cover transition-transform group-hover:scale-[1.02] duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FolderOpen className="h-10 w-10 text-muted-foreground/30" strokeWidth={1.5} />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 space-y-2">
        <h3 className="font-bold text-base leading-snug group-hover:underline line-clamp-1">
          {collection.name}
        </h3>
        {collection.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{collection.description}</p>
        )}
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-muted-foreground">
            {collection._count.findings}{" "}
            {collection._count.findings === 1 ? "Fund" : "Funde"}
          </span>
          <span className="flex items-center gap-1.5">
            <Avatar className="h-5 w-5 rounded-full">
              <AvatarImage src={collection.user.image ?? undefined} />
              <AvatarFallback className="rounded-full bg-[#2d2d2d] text-white text-[8px] font-bold">
                {getInitials(collection.user.name)}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">{collection.user.name}</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
