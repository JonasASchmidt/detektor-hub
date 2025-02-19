import prisma from "@/lib/prisma";
import { TagCategory } from "@prisma/client";
import TagCategoriesPage from "./TagCategoriesPage";

export default async function TagCategoriesServer() {
  const categories: TagCategory[] = await prisma.tagCategory.findMany({
    orderBy: { name: "asc" },
  });
  return <TagCategoriesPage initialCategories={categories} />;
}
