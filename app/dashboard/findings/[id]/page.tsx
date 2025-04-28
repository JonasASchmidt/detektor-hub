import prisma from "@/lib/prisma";

interface Props {
  params: {
    id: string;
  };
}

export default async function FindingDetailPage({ params }: Props) {
  const { id } = await params;

  const finding = await prisma.finding.findUnique({
    where: { id },
    include: {
      tags: true,
      user: true,
    },
  });

  console.log(finding);

  return <div className="space-y-6">{finding?.name}</div>;
}
