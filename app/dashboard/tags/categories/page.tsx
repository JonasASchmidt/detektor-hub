import prisma from "@/lib/prisma";
import { TagCategoryWithTags } from "@/app/_types/TagCategoryWithTags.type";
import TagCategoriesPage from "./TagCategoriesPage";

export default async function TagCategoriesServer() {
  const categories: TagCategoryWithTags[] = await prisma.tagCategory.findMany({
    orderBy: { name: "asc" },
    include: { tags: true }
  });
  return <TagCategoriesPage initialCategories={categories} />;
}
