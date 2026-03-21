import prisma from "@/lib/prisma";
import TagsPage from "./_components/TagsPage";
import type { Tag, TagCategory } from "@prisma/client";

export default async function TagsServer() {
  const tagCategories: TagCategory[] = await prisma.tagCategory.findMany({
    orderBy: { name: "asc" },
  });
  const tags: Tag[] = await prisma.tag.findMany({ orderBy: { name: "asc" } });
  return <TagsPage initialTags={tags} tagCategories={tagCategories} />;
}
