"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertTriangleIcon,
  CalendarIcon,
  MapPinIcon,
  RouteIcon,
} from "lucide-react";
import { format } from "date-fns";
import dynamic from "next/dynamic";
import NewSessionInlineForm from "@/components/sessions/NewSessionInlineForm";

// Leaflet must be SSR-disabled
const ImportPreviewMap = dynamic(
  () => import("@/components/map/ImportPreviewMap"),
  { ssr: false, loading: () => <div className="h-64 w-full rounded-xl bg-zinc-100 animate-pulse" /> }
);
import { de } from "date-fns/locale";
import type { FindingImport, SessionImport } from "./parsers/types";

interface SessionAssignment {
  mode: "import-track" | "new" | "existing" | "none";
  existingSessionId?: string;
  /** Editable session name (overrides the GPX track name, or the manually entered name) */
  sessionName?: string;
  sessionNamingScheme?: string;
}

interface Props {
  sessions: SessionImport[];
  findings: FindingImport[];
  selectedFindingIds: Set<string>;
  onToggleFinding: (id: string) => void;
  onToggleAllFindings: (select: boolean) => void;
  assignment: SessionAssignment;
  onAssignmentChange: (a: SessionAssignment) => void;
  existingSessions: { id: string; name: string }[];
  onBack: () => void;
  onImport: () => void;
  importing: boolean;
}

export default function PreviewStep({
  sessions,
  findings,
  selectedFindingIds,
  onToggleFinding,
  onToggleAllFindings,
  assignment,
  onAssignmentChange,
  existingSessions,
  onBack,
  onImport,
  importing,
}: Props) {
  const allSelected = findings.length > 0 && selectedFindingIds.size === findings.length;
  const someSelected = selectedFindingIds.size > 0;
  const hasDuplicates = findings.some((f) => f._isDuplicate && selectedFindingIds.has(f._id));

  const gpxSession = sessions[0]; // for now handle first track (GoTerrain outputs one at a time)

  return (
    <div className="flex flex-col gap-5">
      {/* ── GPX Track / Session section ── */}
      {gpxSession && (
        <Card className="p-4 bg-white border">
          <div className="flex items-center gap-2 mb-3">
            <RouteIcon className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold text-sm">Gefundene Begehung (GPX-Track)</h3>
          </div>
          <div className="flex flex-col gap-1 text-sm text-muted-foreground mb-4">
            <span className="font-medium text-foreground">{gpxSession.name}</span>
            <div className="flex items-center gap-1">
              <CalendarIcon className="h-3 w-3" />
              <span>
                {format(gpxSession.dateFrom, "dd.MM.yyyy HH:mm", { locale: de })}
                {gpxSession.dateTo &&
                  ` – ${format(gpxSession.dateTo, "HH:mm", { locale: de })}`}
              </span>
            </div>
            {gpxSession.routeCoordinates && (
              <span>{gpxSession.routeCoordinates.length} Trackpunkte</span>
            )}
          </div>

          {/* Session assignment radio group */}
          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-medium mb-1">
              Als Begehung importieren?
            </legend>

            <Label className="flex items-center gap-2 cursor-pointer font-normal">
              <input
                type="radio"
                name="sessionMode"
                value="import-track"
                checked={assignment.mode === "import-track"}
                onChange={() =>
                  onAssignmentChange({ mode: "import-track", sessionName: gpxSession.name })
                }
              />
              Neue Begehung aus Track erstellen
            </Label>
            {assignment.mode === "import-track" && (
              <Input
                className="ml-6 h-8 text-sm w-72"
                value={assignment.sessionName ?? gpxSession.name}
                onChange={(e) =>
                  onAssignmentChange({ ...assignment, sessionName: e.target.value })
                }
                placeholder="Name der Begehung"
              />
            )}

            <Label className="flex items-center gap-2 cursor-pointer font-normal">
              <input
                type="radio"
                name="sessionMode"
                value="new"
                checked={assignment.mode === "new"}
                onChange={() => onAssignmentChange({ mode: "new" })}
              />
              Neue Begehung manuell anlegen
            </Label>
            {assignment.mode === "new" && (
              <div className="ml-6">
                <NewSessionInlineForm
                  submitLabel="Begehung für Import übernehmen"
                  onSubmit={({ name, namingScheme }) =>
                    onAssignmentChange({ mode: "new", sessionName: name, sessionNamingScheme: namingScheme })
                  }
                />
                {assignment.sessionName && (
                  <p className="mt-2 text-xs text-green-700">
                    ✓ Begehung „{assignment.sessionName}" wird beim Import angelegt.
                  </p>
                )}
              </div>
            )}

            {existingSessions.length > 0 && (
              <Label className="flex items-center gap-2 cursor-pointer font-normal">
                <input
                  type="radio"
                  name="sessionMode"
                  value="existing"
                  checked={assignment.mode === "existing"}
                  onChange={() =>
                    onAssignmentChange({ mode: "existing", existingSessionId: existingSessions[0].id })
                  }
                />
                Zu bestehender Begehung hinzufügen
              </Label>
            )}
            {assignment.mode === "existing" && (
              <select
                className="ml-6 h-8 rounded-md border border-input bg-background px-3 text-sm w-72"
                value={assignment.existingSessionId ?? ""}
                onChange={(e) =>
                  onAssignmentChange({ ...assignment, existingSessionId: e.target.value })
                }
              >
                {existingSessions.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            )}

            <Label className="flex items-center gap-2 cursor-pointer font-normal">
              <input
                type="radio"
                name="sessionMode"
                value="none"
                checked={assignment.mode === "none"}
                onChange={() => onAssignmentChange({ mode: "none" })}
              />
              Keine Begehung zuordnen
            </Label>
          </fieldset>
        </Card>
      )}

      {/* ── No track but ask about session assignment ── */}
      {sessions.length === 0 && (
        <Card className="p-4 bg-white border">
          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-semibold mb-1">
              Begehung zuordnen?
            </legend>

            <Label className="flex items-center gap-2 cursor-pointer font-normal">
              <input
                type="radio"
                name="sessionMode"
                value="none"
                checked={assignment.mode === "none"}
                onChange={() => onAssignmentChange({ mode: "none" })}
              />
              Keine Begehung
            </Label>

            <Label className="flex items-center gap-2 cursor-pointer font-normal">
              <input
                type="radio"
                name="sessionMode"
                value="new"
                checked={assignment.mode === "new"}
                onChange={() => onAssignmentChange({ mode: "new" })}
              />
              Neue Begehung anlegen
            </Label>
            {assignment.mode === "new" && (
              <div className="ml-6">
                <NewSessionInlineForm
                  submitLabel="Begehung für Import übernehmen"
                  onSubmit={({ name, namingScheme }) =>
                    onAssignmentChange({ mode: "new", sessionName: name, sessionNamingScheme: namingScheme })
                  }
                />
                {assignment.sessionName && (
                  <p className="mt-2 text-xs text-green-700">
                    ✓ Begehung „{assignment.sessionName}" wird beim Import angelegt.
                  </p>
                )}
              </div>
            )}

            {existingSessions.length > 0 && (
              <Label className="flex items-center gap-2 cursor-pointer font-normal">
                <input
                  type="radio"
                  name="sessionMode"
                  value="existing"
                  checked={assignment.mode === "existing"}
                  onChange={() =>
                    onAssignmentChange({ mode: "existing", existingSessionId: existingSessions[0].id })
                  }
                />
                Zu bestehender Begehung hinzufügen
              </Label>
            )}
            {assignment.mode === "existing" && (
              <select
                className="ml-6 h-8 rounded-md border border-input bg-background px-3 text-sm w-72"
                value={assignment.existingSessionId ?? ""}
                onChange={(e) =>
                  onAssignmentChange({ ...assignment, existingSessionId: e.target.value })
                }
              >
                {existingSessions.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            )}
          </fieldset>
        </Card>
      )}

      {/* ── Map preview ── */}
      {findings.length > 0 && (
        <ImportPreviewMap
          findings={findings.map((f) => ({ _id: f._id, lat: f.lat, lng: f.lng, name: f.name }))}
          selectedIds={selectedFindingIds}
          routeCoordinates={gpxSession?.routeCoordinates}
          onToggleFinding={onToggleFinding}
          className="h-64 w-full rounded-xl"
        />
      )}

      {/* ── Findings table ── */}
      <Card className="bg-white border overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <MapPinIcon className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold text-sm">
              Funde{" "}
              <span className="text-muted-foreground font-normal">
                ({selectedFindingIds.size} von {findings.length} ausgewählt)
              </span>
            </h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-7"
            onClick={() => onToggleAllFindings(!allSelected)}
          >
            {allSelected ? "Alle abwählen" : "Alle auswählen"}
          </Button>
        </div>

        {hasDuplicates && (
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border-b text-amber-700 text-sm">
            <AlertTriangleIcon className="h-4 w-4 shrink-0" />
            Einige Funde haben dieselben Koordinaten wie bestehende Funde.
          </div>
        )}

        <div className="divide-y max-h-72 overflow-y-auto">
          {findings.map((f) => (
            <FindingRow
              key={f._id}
              finding={f}
              checked={selectedFindingIds.has(f._id)}
              onToggle={() => onToggleFinding(f._id)}
            />
          ))}
        </div>
      </Card>

      {/* ── Actions ── */}
      <div className="flex gap-3">
        <Button
          variant="ghost"
          className="border-2 border-foreground hover:bg-[#2d2d2d] hover:text-white hover:border-[#2d2d2d] font-bold"
          onClick={onBack}
          disabled={importing}
        >
          Zurück
        </Button>
        <Button
          variant="ghost"
          className="flex-1 border-2 border-foreground hover:bg-[#2d2d2d] hover:text-white hover:border-[#2d2d2d] font-bold"
          disabled={!someSelected || importing}
          onClick={onImport}
        >
          {importing
            ? "Wird importiert …"
            : `${selectedFindingIds.size} Fund${selectedFindingIds.size !== 1 ? "e" : ""} importieren`}
        </Button>
      </div>
    </div>
  );
}

function FindingRow({
  finding,
  checked,
  onToggle,
}: {
  finding: FindingImport;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-50 cursor-pointer"
      onClick={onToggle}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        onClick={(e) => e.stopPropagation()}
        className="shrink-0 h-4 w-4 rounded border-gray-300 accent-[#2d2d2d] cursor-pointer"
      />

      {/* Thumbnail for geotagged image imports */}
      {finding.previewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={finding.previewUrl}
          alt={finding.name ?? "Vorschau"}
          className="h-10 w-10 rounded object-cover shrink-0"
        />
      ) : (
        <div className="h-10 w-10 rounded bg-zinc-100 flex items-center justify-center shrink-0">
          <MapPinIcon className="h-4 w-4 text-zinc-400" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium truncate">
            {finding.name ?? "Unbenannter Fund"}
          </span>
          {finding._isDuplicate && (
            <Badge variant="outline" className="text-amber-600 border-amber-300 text-xs py-0">
              Mögliches Duplikat
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {finding.lat.toFixed(6)}, {finding.lng.toFixed(6)}
          {finding.foundAt && (
            <>
              {" · "}
              {format(finding.foundAt, "dd.MM.yyyy HH:mm", { locale: de })}
            </>
          )}
        </p>
        {finding.description && (
          <p className="text-xs text-muted-foreground truncate">{finding.description}</p>
        )}
      </div>
    </div>
  );
}
