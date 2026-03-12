"use client";

import FindingsForm from "./FindingsForm";
import { TagCategoryWithTags } from "@/app/_types/TagCategoryWithTags.type";

interface SessionOption {
  id: string;
  name: string;
  dateFrom: Date;
  dateTo: Date | null;
}

interface Props {
  tagCategories: TagCategoryWithTags[];
  sessions: SessionOption[];
}

export default function FindingsPage({ tagCategories, sessions }: Props) {
  return (
    <div className="px-6 pb-6 pt-12 md:px-10 md:pb-10 md:pt-16 space-y-3 max-w-[720px] mx-auto w-full min-w-0">
      <FindingsForm tagCategories={tagCategories} sessions={sessions} />
    </div>
  );
}
