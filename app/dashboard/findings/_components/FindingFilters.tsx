"use client";

import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useDebounce } from "@/app/_hooks/useDebounce";

export default function FindingsFilters({
  onChange,
}: {
  onChange: (filters: { search: string; sort: string }) => void;
}) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const debouncedSearch = useDebounce(search, 300);

  // Deliberately exclude onChange from deps to prevent infinite re-render loops
  // (parent creates new function ref on each render)
  useEffect(() => {
    onChange({ search: debouncedSearch, sort });
  }, [debouncedSearch, sort]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col md:flex-row gap-4 p-4 bg-muted items-center">
      <Input
        placeholder="Suche nach Name oder Beschreibung..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full md:max-w-sm"
      />

      <Select value={sort} onValueChange={setSort}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Sortieren nach" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="newest">Neueste zuerst</SelectItem>
          <SelectItem value="oldest">Älteste zuerst</SelectItem>
          <SelectItem value="az">A–Z</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
