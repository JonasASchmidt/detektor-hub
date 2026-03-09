"use client";

import FindingsForm from "./FindingsForm";
import { TagCategoryWithTags } from "@/app/_types/TagCategoryWithTags.type";

interface Props {
  tagCategories: TagCategoryWithTags[];
}

export default function FindingsPage({ tagCategories }: Props) {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-4xl font-bold">Neuer Fund</h1>
      <FindingsForm tagCategories={tagCategories} />
    </div>
  );
}
