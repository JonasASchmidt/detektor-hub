import prisma from "@/lib/prisma";
import FindingsPage from "./FindingsPage";
import { TagCategoryWithTags } from "@/app/_types/TagCategoryWithTags.type";

export default async function FindingsServer() {
  const tagCategories: TagCategoryWithTags[] =
    await prisma.tagCategory.findMany({
      include: {
        tags: true,
      },
    });

  return <FindingsPage tagCategories={tagCategories} />;
}
