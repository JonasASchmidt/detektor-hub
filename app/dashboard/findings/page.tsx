import prisma from "@/lib/prisma";
import { Tag } from "@prisma/client";
import FindingsPage from "./FindingsPage";

export default async function FindingsServer() {
  const tags: Tag[] = await prisma.tag.findMany({ orderBy: { name: "asc" } });
  return <FindingsPage tags={tags} />;
}
