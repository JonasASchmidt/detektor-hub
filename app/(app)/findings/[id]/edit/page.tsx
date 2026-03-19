import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { TagCategoryWithTags } from "@/types/TagCategoryWithTags";
import FindingEditInline from "@/app/(app)/findings/_components/FindingEditInline";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditFindingPage({ params }: Props) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  const [finding, tagCategories] = await Promise.all([
    prisma.finding.findUnique({
      where: { id },
      include: { tags: true, images: true, user: true, comments: { include: { user: true } } },
    }),
    prisma.tagCategory.findMany({
      include: { tags: true },
    }) as Promise<TagCategoryWithTags[]>,
  ]);

  if (!finding) notFound();

  // Only the owner may edit — return 404 to avoid leaking existence
  if (!session?.user?.id || finding.userId !== session.user.id) notFound();

  const initialData: FindingFormData = {
    name: finding.name ?? "",
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
    datingFrom: finding.datingFrom ?? undefined,
    datingTo: finding.datingTo ?? undefined,
    references: finding.references ?? undefined,
    locationPublic: finding.locationPublic,
  };


  return (
    <FindingEditInline
      finding={finding}
      tagCategories={tagCategories}
      initialImages={finding.images}
    />
  );
}
