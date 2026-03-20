"use client";

import FindingsForm from "../../_components/FindingsForm";
import { TagCategoryWithTags } from "@/types/TagCategoryWithTags";

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
    <div className="px-4 pb-6 pt-12 md:px-10 md:pb-10 md:pt-16 space-y-3 max-w-[720px] mx-auto w-full min-w-0">
      <FindingsForm tagCategories={tagCategories} sessions={sessions} />
    </div>
  );
}
