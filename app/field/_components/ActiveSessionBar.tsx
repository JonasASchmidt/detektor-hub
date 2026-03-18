"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import {
  ChevronDown,
  CircleStop,
  MapPin,
  Navigation,
  NavigationOff,
  Plus,
  Radio,
  Smartphone,
} from "lucide-react";
import { cn } from "@/lib/utils";

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

interface Props {
  openSessions: OpenSession[];
  activeSession: ActiveSession | null;
  onSessionChange: (session: ActiveSession | null) => void;
  // Route tracking state + controls (owned by FieldPageClient)
  isTracking: boolean;
  trackingPoints: number;
  trackingAccuracy: number | null;
  trackingError: string | null;
  wakeLockActive: boolean;
  onStartTracking: () => void;
  onStopTracking: () => void;
}

export default function ActiveSessionBar({
  openSessions,
  activeSession,
  onSessionChange,
  isTracking,
  trackingPoints,
  trackingAccuracy,
  trackingError,
  wakeLockActive,
  onStartTracking,
  onStopTracking,
}: Props) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [newSessionName, setNewSessionName] = useState("");
  const [newSessionScheme, setNewSessionScheme] = useState("");
  const [creatingSession, setCreatingSession] = useState(false);

  async function activateSession(session: OpenSession) {
    const res = await fetch("/api/active-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: session.id }),
    });
    if (!res.ok) { toast.error("Session konnte nicht aktiviert werden."); return; }
    onSessionChange({ id: session.id, name: session.name, namingScheme: session.namingScheme });
    setSheetOpen(false);
    toast.success(`Session „${session.name}" aktiv`);
  }

  async function deactivateSession() {
    if (isTracking) onStopTracking();
    await fetch("/api/active-session", { method: "DELETE" });
    onSessionChange(null);
    toast.info("Session beendet");
  }

  async function createAndActivate() {
    if (!newSessionName.trim()) return;
    setCreatingSession(true);

    const res = await fetch("/api/field-sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newSessionName.trim(),
        namingScheme: newSessionScheme.trim() || null,
        dateFrom: new Date().toISOString(),
      }),
    });

    if (!res.ok) {
      toast.error("Session konnte nicht erstellt werden.");
      setCreatingSession(false);
      return;
    }

    const { fieldSession } = await res.json();
    await fetch("/api/active-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: fieldSession.id }),
    });

    onSessionChange({ id: fieldSession.id, name: fieldSession.name, namingScheme: fieldSession.namingScheme ?? null });
    setNewSessionName("");
    setNewSessionScheme("");
    setCreatingSession(false);
    setSheetOpen(false);
    toast.success(`Session „${fieldSession.name}" gestartet`);
  }

  return (
    <div
      className={cn(
        "border-b text-sm",
        activeSession
          ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800"
          : "bg-muted/50 border-border"
      )}
    >
      {/* Main row */}
      <div className="flex items-center justify-between gap-2 px-4 py-3">
        {/* Session picker trigger */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <button className="flex items-center gap-2 min-w-0 flex-1 text-left">
              <MapPin className={cn("h-4 w-4 shrink-0", activeSession ? "text-emerald-600" : "text-muted-foreground")} />
              <span className="truncate font-medium">
                {activeSession ? activeSession.name : "Keine aktive Session"}
              </span>
              <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
            </button>
          </SheetTrigger>

          <SheetContent side="bottom" className="max-h-[80dvh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Session auswählen</SheetTitle>
            </SheetHeader>

            <div className="mt-4 flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Neue Session starten</Label>
                <Input
                  placeholder="Session-Name"
                  value={newSessionName}
                  onChange={(e) => setNewSessionName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && createAndActivate()}
                />
                <Input
                  placeholder="Benennungsschema (optional), z. B. {session}-{n:03}"
                  value={newSessionScheme}
                  onChange={(e) => setNewSessionScheme(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Tokens:{" "}
                  <code className="bg-muted px-1 rounded">{"{session}"}</code>{" "}
                  <code className="bg-muted px-1 rounded">{"{n:03}"}</code>{" "}
                  <code className="bg-muted px-1 rounded">{"{date}"}</code>
                </p>
                <Button onClick={createAndActivate} disabled={creatingSession || !newSessionName.trim()}>
                  <Plus className="h-4 w-4 mr-1" />
                  Session starten
                </Button>
              </div>

              {openSessions.length > 0 && (
                <div className="flex flex-col gap-1">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Offene Sessions</Label>
                  {openSessions.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => activateSession(s)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-md text-sm text-left w-full hover:bg-muted transition-colors",
                        activeSession?.id === s.id && "bg-emerald-100 dark:bg-emerald-900/40"
                      )}
                    >
                      <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0">
                        <p className="font-medium truncate">{s.name}</p>
                        {s.namingScheme && (
                          <p className="text-xs text-muted-foreground truncate">Schema: {s.namingScheme}</p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>

        {/* Controls: route + beenden */}
        {activeSession && (
          <div className="flex items-center gap-2 shrink-0">
            {isTracking && (
              <span className="flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400">
                <Radio className="h-3 w-3 animate-pulse" />
                {trackingPoints}
                {trackingAccuracy !== null && (
                  <span className="text-muted-foreground">±{trackingAccuracy}m</span>
                )}
                {/* Wake lock indicator — green phone = screen stays on */}
                <Smartphone
                  className={cn(
                    "h-3 w-3",
                    wakeLockActive ? "text-emerald-600" : "text-muted-foreground"
                  )}
                />
              </span>
            )}
            {trackingError && (
              <span className="text-xs text-destructive truncate max-w-[80px]">{trackingError}</span>
            )}
            <Button
              size="sm"
              variant={isTracking ? "destructive" : "outline"}
              onClick={isTracking ? onStopTracking : onStartTracking}
              className="h-8 px-3 text-xs"
            >
              {isTracking ? (
                <><NavigationOff className="h-3 w-3 mr-1" />Stop</>
              ) : (
                <><Navigation className="h-3 w-3 mr-1" />Route</>
              )}
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={deactivateSession}
              className="h-8 px-3 text-xs"
            >
              <CircleStop className="h-3 w-3 mr-1" />
              Beenden
            </Button>
          </div>
        )}
      </div>

      {/* Naming scheme hint */}
      {activeSession?.namingScheme && (
        <p className="px-4 pb-2 text-xs text-emerald-700 dark:text-emerald-400">
          Schema: <span className="font-medium">{activeSession.namingScheme}</span>
        </p>
      )}
    </div>
  );
}
