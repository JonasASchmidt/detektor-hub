import prisma from "@/lib/prisma";
import TagsPage from "./TagsPage"; // Client-side component
import { Tag } from "@prisma/client";

export default async function TagsServer() {
  const tags: Tag[] = await prisma.tag.findMany({ orderBy: { name: "asc" } });
  return <TagsPage initialTags={tags} />;
}
