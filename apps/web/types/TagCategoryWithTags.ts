import { Prisma } from "@prisma/client";

export type TagCategoryWithTags = Prisma.TagCategoryGetPayload<{
  include: { tags: true };
}>;
