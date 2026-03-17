import prisma from "@/lib/prisma";
import { TagCategoryWithTags } from "@/types/TagCategoryWithTags";
import TagCategoriesPage from "./_components/TagCategoriesPage";

export default async function TagCategoriesServer() {
  const categories: TagCategoryWithTags[] = await prisma.tagCategory.findMany({
    orderBy: { name: "asc" },
    include: { tags: true }
  });
  return <TagCategoriesPage initialCategories={categories} />;
}
