import prisma from "@/lib/prisma";
import FindingDetail from "../_components/FindingDetail";
import { FindingWithRelations } from "@/app/_types/FindingWithRelations.type";

interface Props {
  params: {
    id: string;
  };
}

export default async function FindingDetailPage({ params }: Props) {
  const { id } = await params;

  const finding: FindingWithRelations | null = await prisma.finding.findUnique({
    where: { id },
    include: {
      comments: true,
      images: true,
      tags: true,
      user: true,
    },
  });

  if (!finding) {
    return <p>404 ERROR</p>;
  }

  return <FindingDetail finding={finding} />;
}
