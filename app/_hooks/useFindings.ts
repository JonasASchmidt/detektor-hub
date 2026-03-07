"use client";

import { useEffect, useState } from "react";
import { FindingWithRelations } from "../_types/FindingWithRelations.type";

export interface UseFindingsParams {
  search?: string;
  tag?: string;
  page?: number;
  pageSize?: number;
  orderBy?: string;
  order?: "asc" | "desc";
}

export function useFindings(params: UseFindingsParams) {
  const [data, setData] = useState<{
    findings: FindingWithRelations[];
    total: number;
  }>({
    findings: [],
    total: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<null | string>(null);

  useEffect(() => {
    const fetchFindings = async () => {
      setLoading(true);
      setError(null);

      const query = new URLSearchParams({
        ...(params.search ? { q: params.search } : {}),
        ...(params.tag ? { tag: params.tag } : {}),
        ...(params.page ? { page: params.page.toString() } : {}),
        ...(params.pageSize ? { pageSize: params.pageSize.toString() } : {}),
        ...(params.orderBy ? { orderBy: params.orderBy } : {}),
        ...(params.order ? { order: params.order } : {}),
      });

      try {
        const res = await fetch(`/api/findings?${query}`);
        const json = await res.json();

        if (!res.ok) throw new Error(json.error || "Something went wrong");

        setData({ findings: json.findings, total: json.total });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchFindings();
  }, [params]);

  return { ...data, loading, error };
}
