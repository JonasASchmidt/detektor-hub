"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useFindings, UseFindingsParams } from "@/app/_hooks/useFindings";
import FindingCard from "./FindingCard";

interface Props {
  filters: UseFindingsParams;
}

const PAGE_SIZE = 20;

export default function FindingsList({ filters }: Props) {
  const [page, setPage] = useState(1);

  const queryParams = useMemo(
    () =>
      ({
        ...filters,
        page,
        pageSize: PAGE_SIZE,
      } as UseFindingsParams),
    [filters, page]
  );

  const { findings, total, loading, error: _error } = useFindings(queryParams);

  useEffect(() => {
    setPage(1);
  }, [filters]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const handlePrevious = () => {
    setPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNext = () => {
    setPage((prev) => Math.min(prev + 1, totalPages));
  };

  return (
    <div className="max-w-4xl mx-auto grid py-6">
      {findings.map((finding) => (
        <FindingCard key={finding.id} finding={finding} />
      ))}

      <div className="flex items-center justify-between mt-4">
        <Button onClick={handlePrevious} disabled={page === 1 || loading}>
          Zurück
        </Button>

        <span className="text-sm text-muted-foreground">
          Seite {page} von {totalPages}
        </span>

        <Button onClick={handleNext} disabled={page === totalPages || loading}>
          Weiter
        </Button>
      </div>
    </div>
  );
}
