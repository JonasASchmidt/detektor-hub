"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { SelectFilter } from "@/components/filters";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface LogEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  entityOwnerId: string | null;
  changes: { field: string; before: unknown; after: unknown }[] | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  user: { id: string; name: string | null; email: string };
}

const ACTION_COLORS: Record<string, string> = {
  create: "bg-green-100 text-green-800",
  update: "bg-blue-100 text-blue-800",
  delete: "bg-red-100 text-red-800",
};

function actionColor(action: string): string {
  for (const [verb, cls] of Object.entries(ACTION_COLORS)) {
    if (action.includes(verb)) return cls;
  }
  return "bg-gray-100 text-gray-700";
}

const ENTITY_TYPE_OPTIONS = [
  { value: "", label: "Alle Typen" },
  { value: "finding", label: "Fund" },
  { value: "comment", label: "Kommentar" },
];

export default function ActivityLogPanel() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [entityType, setEntityType] = useState("");
  const [loading, setLoading] = useState(false);
  const pageSize = 20;

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (entityType) params.set("entityType", entityType);
    fetch(`/api/activity-log?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setLogs(data.logs ?? []);
        setTotal(data.total ?? 0);
      })
      .finally(() => setLoading(false));
  }, [page, entityType]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <SelectFilter
          value={entityType}
          onChange={(v) => { setEntityType(v); setPage(1); }}
          options={ENTITY_TYPE_OPTIONS}
          className="w-[160px]"
        />
        <span className="text-sm text-muted-foreground">{total} Einträge</span>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Laden…</p>}

      {!loading && logs.length === 0 && (
        <p className="text-sm text-muted-foreground">Keine Einträge gefunden.</p>
      )}

      <div className="space-y-2">
        {logs.map((log) => (
          <div key={log.id} className="rounded-lg border border-black/[0.07] bg-muted p-3 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${actionColor(log.action)}`}>
                {log.action}
              </span>
              <span className="text-xs font-medium text-foreground/70">{log.entityType}</span>
              {(log.metadata as any)?.name && (
                <span className="text-xs font-semibold truncate max-w-[180px]">{String((log.metadata as any).name)}</span>
              )}
              <span className="ml-auto text-[11px] text-muted-foreground">
                {format(new Date(log.createdAt), "d. MMM yyyy, HH:mm", { locale: de })}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              {log.user.name ?? log.user.email}
            </div>
            {log.changes && log.changes.length > 0 && (
              <ul className="text-xs space-y-0.5 mt-1">
                {log.changes.map((c, i) => (
                  <li key={i} className="flex gap-1.5 items-start">
                    <span className="font-medium shrink-0">{c.field}:</span>
                    <span className="text-red-600 line-through">{String(c.before ?? "–")}</span>
                    <span className="text-green-700">{String(c.after ?? "–")}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-2 justify-end pt-1">
          <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">{page} / {totalPages}</span>
          <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
