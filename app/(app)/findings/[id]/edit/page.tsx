import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { TagCategoryWithTags } from "@/types/TagCategoryWithTags";
import { FindingFormData } from "@/schemas/finding";
import FindingsForm from "@/app/(app)/findings/_components/FindingsForm";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditFindingPage({ params }: Props) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  const [finding, tagCategories, sessions] = await Promise.all([
    prisma.finding.findUnique({
      where: { id },
      include: { tags: true, images: true },
    }),
    prisma.tagCategory.findMany({
      include: { tags: true },
    }) as Promise<TagCategoryWithTags[]>,
    prisma.fieldSession.findMany({
      select: { id: true, name: true, dateFrom: true, dateTo: true },
      orderBy: { dateFrom: "desc" },
    }),
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
    <div className="px-6 pb-6 pt-12 md:px-10 md:pb-10 md:pt-16 space-y-3 max-w-[720px] mx-auto w-full min-w-0">
      <FindingsForm
        tagCategories={tagCategories}
        sessions={sessions}
        findingId={id}
        initialData={initialData}
        initialImages={finding.images}
      />
    </div>
  );
}
