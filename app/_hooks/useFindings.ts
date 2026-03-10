"use client";

import { useEffect, useMemo, useState } from "react";
import { FindingWithRelations } from "../_types/FindingWithRelations.type";

export interface UseFindingsParams {
  search?: string;
  tag?: string;
  page?: number;
  pageSize?: number;
  orderBy?: string;
  order?: "asc" | "desc";
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  tags?: string[];
  reported?: string;
  lat?: number;
  lng?: number;
  radius?: number;
}

export function useFindings(params: UseFindingsParams, endpoint: string = "/api/findings") {
  const [data, setData] = useState<{
    findings: FindingWithRelations[];
    total: number;
  }>({
    findings: [],
    total: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<null | string>(null);

  // Stabilize params to avoid infinite re-renders when parent creates new object refs
  const stableParams = useMemo(() => JSON.stringify(params), [params]);

  useEffect(() => {
    const fetchFindings = async () => {
      setLoading(true);
      setError(null);

      const p: UseFindingsParams = JSON.parse(stableParams);

      const query = new URLSearchParams({
        ...(p.search ? { q: p.search } : {}),
        ...(p.tag ? { tag: p.tag } : {}),
        ...(p.page ? { page: p.page.toString() } : {}),
        ...(p.pageSize ? { pageSize: p.pageSize.toString() } : {}),
        ...(p.orderBy ? { orderBy: p.orderBy } : {}),
        ...(p.order ? { order: p.order } : {}),
        ...(p.status ? { status: p.status } : {}),
        ...(p.dateFrom ? { dateFrom: p.dateFrom } : {}),
        ...(p.dateTo ? { dateTo: p.dateTo } : {}),
        ...(p.tags && p.tags.length > 0 ? { tags: p.tags.join(",") } : {}),
        ...(p.reported ? { reported: p.reported } : {}),
        ...(p.lat !== undefined ? { lat: p.lat.toString() } : {}),
        ...(p.lng !== undefined ? { lng: p.lng.toString() } : {}),
        ...(p.radius !== undefined ? { radius: p.radius.toString() } : {}),
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
  }, [stableParams]);

  return { ...data, loading, error };
}
