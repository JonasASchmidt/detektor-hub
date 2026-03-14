import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { TagCategoryWithTags } from "@/app/_types/TagCategoryWithTags.type";
import { FindingFormData } from "@/schemas/finding";
import FindingsForm from "@/app/dashboard/findings/new/FindingsForm";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditFindingPage({ params }: Props) {
  const { id } = await params;

  const [finding, tagCategories] = await Promise.all([
    prisma.finding.findUnique({
      where: { id },
      include: { tags: true, images: true },
    }),
    prisma.tagCategory.findMany({
      include: { tags: true },
    }) as Promise<TagCategoryWithTags[]>,
  ]);

  if (!finding) notFound();

  const initialData: FindingFormData = {
    name: finding.name,
    location: { lat: finding.latitude ?? 51.0504, lng: finding.longitude ?? 13.7373 },
    description: finding.description ?? undefined,
    foundAt: finding.foundAt,
    tags: finding.tags.map((t) => t.id),
    images: finding.images.map((i) => i.id),
    thumbnailId: finding.thumbnailId ?? undefined,
    depth: finding.depth ?? undefined,
    weight: finding.weight ?? undefined,
    diameter: finding.diameter ?? undefined,
    dating: finding.dating ?? undefined,
    dating_from: finding.dating_from ?? undefined,
    dating_to: finding.dating_to ?? undefined,
    references: finding.references ?? undefined,
  };

  return (
    <div className="px-6 pb-6 pt-12 md:px-10 md:pb-10 md:pt-16 space-y-3 max-w-[720px] mx-auto w-full min-w-0">
      <FindingsForm
        tagCategories={tagCategories}
        findingId={id}
        initialData={initialData}
        initialImages={finding.images}
      />
    </div>
  );
}
