import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

export interface MobileSession {
  id: string;
  name: string;
  description: string | null;
  dateFrom: string;
  dateTo: string | null;
  zone: { id: string; name: string } | null;
  detector: { id: string; company: string; name: string } | null;
  findings: { id: string }[];
}

interface UseSessionsResult {
  sessions: MobileSession[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useSessions(): UseSessionsResult {
  const [sessions, setSessions] = useState<MobileSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/mobile/sessions");
      if (!res.ok) throw new Error("Fehler beim Laden der Sessions.");
      const data = await res.json();
      setSessions(data.fieldSessions);
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
