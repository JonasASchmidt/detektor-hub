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
          Funde
        </h1>
      </header>
      <p className="mt-2 text-md text-gray-600 dark:text-gray-400">
        Funde sind archäologische Objekte oder Artefakte, die bei Ausgrabungen
        oder Entdeckungen geborgen wurden. Sie dienen der wissenschaftlichen
        Erforschung und Dokumentation historischer Epochen. Jeder Fund kann mit
        mehreren Tags versehen werden, um eine präzise Kategorisierung und
        bessere Auffindbarkeit zu ermöglichen. Auf dieser Seite kannst du neue
        Funde anlegen oder bestehende verwalten.
      </p>
      <FindingsForm tagCategories={tagCategories} />
    </div>
  );
}
