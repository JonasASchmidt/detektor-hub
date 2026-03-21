/**
 * useSessions — loads and merges sessions from two sources:
 *   1. Local SQLite (pending sessions not yet synced to server)
 *   2. Server API   (already-synced sessions)
 *
 * Pending sessions are shown first, then server sessions, sorted newest first.
 * If offline, only local sessions are shown (no error state — just less data).
 */
import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { getPendingSessions } from "@/lib/db";

export interface SessionListItem {
  id: string;
  name: string;
  description: string | null;
  dateFrom: string;
  dateTo: string | null;
  findCount: number;
  /** true = not yet synced to server */
  isPending: boolean;
  zone: { id: string; name: string } | null;
  detector: { id: string; company: string; name: string } | null;
}

interface UseSessionsResult {
  sessions: SessionListItem[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useSessions(): UseSessionsResult {
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // ── 1. Local pending sessions ──────────────────────────────────────────
      const localSessions = await getPendingSessions();
      const localItems: SessionListItem[] = localSessions.map((s) => ({
        id: s.id,
        name: s.name,
        description: null,
        dateFrom: s.dateFrom,
        dateTo: s.dateTo,
        findCount: s.findCount,
        isPending: true,
        zone: null,
        detector: null,
      }));

      // ── 2. Server sessions (best-effort; offline = silently skip) ──────────
      let serverItems: SessionListItem[] = [];
      try {
        const res = await apiFetch("/api/mobile/sessions");
        if (res.ok) {
          const { fieldSessions } = await res.json();
          serverItems = (
            fieldSessions as Array<{
              id: string;
              name: string;
              description: string | null;
              dateFrom: string;
              dateTo: string | null;
              findings: unknown[];
              zone: { id: string; name: string } | null;
              detector: { id: string; company: string; name: string } | null;
            }>
          ).map((s) => ({
            id: s.id,
            name: s.name,
            description: s.description ?? null,
            dateFrom: s.dateFrom,
            dateTo: s.dateTo ?? null,
            findCount: Array.isArray(s.findings) ? s.findings.length : 0,
            isPending: false,
            zone: s.zone ?? null,
            detector: s.detector ?? null,
          }));
        }
      } catch {
        // Offline — server list will be empty; local items still show
      }

      // Pending first, then server sessions newest-first (already sorted from API)
      setSessions([...localItems, ...serverItems]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { sessions, isLoading, error, refresh };
}
