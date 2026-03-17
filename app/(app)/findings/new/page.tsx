import prisma from "@/lib/prisma";
import FindingsPage from "./FindingsPage";
import { TagCategoryWithTags } from "@/app/_types/TagCategoryWithTags.type";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function FindingsServer() {
  const session = await getServerSession(authOptions);

  const [tagCategories, sessions] = await Promise.all([
    prisma.tagCategory.findMany({ include: { tags: true } }) as Promise<TagCategoryWithTags[]>,
    session?.user?.id
      ? prisma.fieldSession.findMany({
          where: { userId: session.user.id },
          select: { id: true, name: true, dateFrom: true, dateTo: true },
          orderBy: { dateFrom: "desc" },
        })
      : Promise.resolve([]),
  ]);

  return <FindingsPage tagCategories={tagCategories} sessions={sessions} />;
}
