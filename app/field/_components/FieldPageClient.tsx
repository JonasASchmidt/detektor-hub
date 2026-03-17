"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft, Map, MapPinOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import ActiveSessionBar from "./ActiveSessionBar";
import QuickFindForm from "./QuickFindForm";
import { useRouteTracker } from "./useRouteTracker";

const SessionMap = dynamic(() => import("@/components/map/SessionMap"), { ssr: false });

interface OpenSession {
  id: string;
  name: string;
  namingScheme: string | null;
  dateFrom: Date | string;
}

interface ActiveSession {
  id: string;
  name: string;
  namingScheme: string | null;
}

interface SessionFinding {
  id: string;
  latitude: number;
  longitude: number;
  name: string | null;
}

interface Props {
  openSessions: OpenSession[];
  initialActiveSession: ActiveSession | null;
}

export default function FieldPageClient({ openSessions, initialActiveSession }: Props) {
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(initialActiveSession);
  const [showMap, setShowMap] = useState(false);
  const [sessionFindings, setSessionFindings] = useState<SessionFinding[]>([]);
  // Incremented after each submitted find to trigger a findings refresh
  const [findSubmitCount, setFindSubmitCount] = useState(0);

  const { isTracking, points, accuracy, error, startTracking, stopTracking } =
    useRouteTracker(activeSession?.id ?? null);

  const fetchSessionFindings = useCallback(async (sessionId: string) => {
    try {
      const res = await fetch(`/api/field-sessions/${sessionId}`);
      if (!res.ok) return;
      const { fieldSession } = await res.json();
      setSessionFindings(fieldSession.findings ?? []);
    } catch {
      // non-critical
    }
  }, []);

  useEffect(() => {
    if (activeSession?.id) {
      fetchSessionFindings(activeSession.id);
    } else {
      setSessionFindings([]);
    }
  }, [activeSession?.id, findSubmitCount, fetchSessionFindings]);

  function handleSessionChange(session: ActiveSession | null) {
    setActiveSession(session);
    if (!session) setShowMap(false);
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b">
        <Link href="/findings" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="font-semibold text-base flex-1">Felderfassung</h1>
        {activeSession && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowMap((v) => !v)}
            className="h-8 w-8 p-0"
            title={showMap ? "Karte ausblenden" : "Karte anzeigen"}
          >
            {showMap ? <MapPinOff className="h-4 w-4" /> : <Map className="h-4 w-4" />}
          </Button>
        )}
      </div>

      {/* Session bar */}
      <ActiveSessionBar
        openSessions={openSessions}
        activeSession={activeSession}
        onSessionChange={handleSessionChange}
        isTracking={isTracking}
        trackingPoints={points.length}
        trackingAccuracy={accuracy}
        trackingError={error}
        onStartTracking={startTracking}
        onStopTracking={stopTracking}
      />

      {/* Collapsible map */}
      {showMap && activeSession && (
        <div className="border-b">
          <SessionMap
            findings={sessionFindings}
            livePoints={points}
            className="h-56 w-full"
          />
        </div>
      )}

      {/* Find form */}
      <div className="flex-1 overflow-y-auto">
        <QuickFindForm
          activeSession={activeSession}
          onFindSubmitted={() => setFindSubmitCount((c) => c + 1)}
        />
      </div>
    </>
  );
}
