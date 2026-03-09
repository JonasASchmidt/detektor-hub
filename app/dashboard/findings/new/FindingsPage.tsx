"use client";

import FindingsForm from "./FindingsForm";
import { TagCategoryWithTags } from "@/app/_types/TagCategoryWithTags.type";

interface Props {
  tagCategories: TagCategoryWithTags[];
}

export default function FindingsPage({ tagCategories }: Props) {
  return (
    <div className="p-6 md:pt-12 space-y-6 max-w-3xl mx-auto">
      <h1 className="text-4xl font-bold">Neuer Fund</h1>
      <FindingsForm tagCategories={tagCategories} />
    </div>
  );
}
