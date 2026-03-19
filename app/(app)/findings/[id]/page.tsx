import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import FindingDetail from "../_components/FindingDetail";
import { FindingWithRelations } from "@/types/FindingWithRelations";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function FindingDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  const finding: FindingWithRelations | null = await prisma.finding.findUnique({
    where: { id },
    include: {
      comments: { include: { user: true }, orderBy: { createdAt: "desc" } },
      images: true,
      tags: true,
      user: true,
    },
  });

  if (!finding) {
    return <p>404 ERROR</p>;
  }

  const commentIds = finding.comments.map((c) => c.id);

  // Fetch vote data for the finding and all its comments in parallel
  const [votesCount, userVoteRecord, commentVoteCounts, commentUserVotes] =
    await Promise.all([
      prisma.vote.count({ where: { targetType: "FINDING", targetId: id } }),
      session?.user?.id
        ? prisma.vote.findUnique({
            where: {
              userId_targetType_targetId: {
                userId: session.user.id,
                targetType: "FINDING",
                targetId: id,
              },
            },
            select: { id: true },
          })
        : null,
      commentIds.length > 0
        ? prisma.vote.groupBy({
            by: ["targetId"],
            where: { targetType: "COMMENT", targetId: { in: commentIds } },
            _count: { targetId: true },
          })
        : [],
      session?.user?.id && commentIds.length > 0
        ? prisma.vote.findMany({
            where: {
              targetType: "COMMENT",
              targetId: { in: commentIds },
              userId: session.user.id,
            },
            select: { targetId: true },
          })
        : [],
    ]);

  const commentVoteCountMap = Object.fromEntries(
    commentVoteCounts.map((v) => [v.targetId, v._count.targetId])
  );
  const commentUserVotedSet = new Set(
    commentUserVotes.map((v) => v.targetId)
  );

  return (
    <FindingDetail
      finding={finding}
      votesCount={votesCount}
      userVoted={!!userVoteRecord}
      commentVoteCountMap={commentVoteCountMap}
      commentUserVotedSet={commentUserVotedSet}
    />
  );
}
