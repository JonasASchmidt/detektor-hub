"use client";

import FindingsForm from "./FindingsForm";
import { TagCategoryWithTags } from "@/app/_types/TagCategoryWithTags.type";

interface Props {
  tagCategories: TagCategoryWithTags[];
}

export default function FindingsPage({ tagCategories }: Props) {
  return (
    <div className="px-6 pb-6 pt-12 md:px-10 md:pb-10 md:pt-16 space-y-3 max-w-[720px] mx-auto w-full">
      <h1 className="text-4xl font-bold">Neuer Fund</h1>
      <FindingsForm tagCategories={tagCategories} />
    </div>
  );
}
