import type { Prisma } from "@prisma/client";

export type FindingWithRelations = Prisma.FindingGetPayload<{
  include: {
    images: true;
    tags: true;
    user: true;
    comments: { include: { user: true } };
  };
}>;
