"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { CldImage } from "next-cloudinary";
import Tag from "@/components/tags/Tag";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Tag as TagType, Image as ImageType } from "@prisma/client";

interface CommunityFinding {
  id: string;
  name: string;
  description: string | null;
  status: string;
  createdAt: string;
  foundAt: string | null;
  dating: string | null;
  images: ImageType[];
  tags: TagType[];
}

function useCommunityFindings() {
  const [findings, setFindings] = useState<CommunityFinding[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch("/api/community/findings?pageSize=20")
      .then((res) => (res.ok ? res.json() : { findings: [] }))
      .then((data) => setFindings(data.findings))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { findings, loading };
}

function CommunityCard({ finding }: { finding: CommunityFinding }) {
  const formattedDate = finding.foundAt
    ? format(new Date(finding.foundAt), "dd.MM.yyyy")
    : format(new Date(finding.createdAt), "dd.MM.yyyy");

  return (
    <div className="flex gap-4 p-4 border rounded-xl bg-white dark:bg-gray-900">
      <div className="w-24 h-24 flex-shrink-0 relative">
        {finding.images.length > 0 ? (
          <CldImage
            src={finding.images[0].publicId}
            width={256}
            height={256}
            crop="fill"
            gravity="auto"
            alt="Fund"
            quality="3"
            format="auto"
            className="rounded-md object-cover w-full h-full"
          />
        ) : (
          <div className="w-full h-full bg-gray-300 flex items-center justify-center rounded-md">
            <span className="text-gray-500 text-xs">Kein Bild</span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col min-w-0">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-bold truncate">
            {finding.name}
          </h3>
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {formattedDate}
          </span>
        </div>

        {finding.description && (
          <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 mt-1">
            {finding.description}
          </p>
        )}

        {finding.dating && (
          <span className="text-xs text-muted-foreground mt-2">
            {finding.dating}
          </span>
        )}

        {finding.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {finding.tags.map((tag) => (
              <Tag key={tag.id} tag={tag} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SectionSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-28 w-full rounded-xl" />
      ))}
    </div>
  );
}

export default function CommunityPage() {
  const { findings, loading } = useCommunityFindings();
  const [search, setSearch] = useState("");

  const lowerSearch = search.toLowerCase();
  const filtered = findings.filter((f) => {
    if (!lowerSearch) return true;
    return (
      f.name.toLowerCase().includes(lowerSearch) ||
      f.description?.toLowerCase().includes(lowerSearch) ||
      f.dating?.toLowerCase().includes(lowerSearch) ||
      f.tags.some((t) => t.name.toLowerCase().includes(lowerSearch))
    );
  });

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <h1 className="text-4xl font-bold">Community</h1>
      <Input
        placeholder="Suche..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full md:max-w-[200px]"
      />
      <section>
        <h2 className="text-2xl font-bold mb-4">Neueste Beiträge</h2>
        {loading ? (
          <SectionSkeleton />
        ) : filtered.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Noch keine Funde vorhanden.
          </p>
        ) : (
          <div className="space-y-3">
            {filtered.map((f) => (
              <CommunityCard key={f.id} finding={f} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
