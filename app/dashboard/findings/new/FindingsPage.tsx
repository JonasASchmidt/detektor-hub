"use client";

import FindingsForm from "./FindingsForm";
import { TagCategoryWithTags } from "@/app/_types/TagCategoryWithTags.type";

interface Props {
  tagCategories: TagCategoryWithTags[];
}

export default function FindingsPage({ tagCategories }: Props) {
  return (
    <div className="max-w-4xl mx-auto py-10 px-6 space-y-8">
      <header className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
          Neuer Fund
        </h1>
      </header>
      <FindingsForm tagCategories={tagCategories} />
    </div>
  );
}
