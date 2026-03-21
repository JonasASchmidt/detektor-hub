"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import UploadStep from "./UploadStep";
import PreviewStep from "./PreviewStep";
import ConfirmStep, { type ImportResult } from "./ConfirmStep";
import type { ParsedImport, FindingImport } from "./parsers/types";

type Step = "upload" | "preview" | "done";

interface SessionAssignment {
  mode: "import-track" | "new" | "existing" | "none";
  existingSessionId?: string;
  sessionName?: string;
  sessionNamingScheme?: string;
}

interface Props {
  existingSessions: { id: string; name: string }[];
}

export default function ImportWizard({ existingSessions }: Props) {
  const [step, setStep] = useState<Step>("upload");
  const [parsed, setParsed] = useState<ParsedImport | null>(null);
  const [fileName, setFileName] = useState("");
  const [selectedFindingIds, setSelectedFindingIds] = useState<Set<string>>(new Set());
  const [assignment, setAssignment] = useState<SessionAssignment>({ mode: "none" });
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  function handleParsed(result: ParsedImport, name: string) {
    setParsed(result);
    setFileName(name);
    // Pre-select all findings
    setSelectedFindingIds(new Set(result.findings.map((f) => f._id)));
    // Default session assignment: import the track if present
    if (result.sessions.length > 0) {
      setAssignment({ mode: "import-track", sessionName: result.sessions[0].name });
    } else {
      setAssignment({ mode: "none" });
    }
    setStep("preview");
  }

  function handleToggleFinding(id: string) {
    setSelectedFindingIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleToggleAll(select: boolean) {
    if (!parsed) return;
    setSelectedFindingIds(select ? new Set(parsed.findings.map((f) => f._id)) : new Set());
  }

  async function handleImport() {
    if (!parsed) return;
    setImporting(true);

    try {
      let fieldSessionId: string | undefined;
      let sessionCreated = false;
      let sessionName: string | undefined;
      let sessionId: string | undefined;

      // ── 1. Create session if needed ──
      if (assignment.mode === "import-track" && parsed.sessions.length > 0) {
        const track = parsed.sessions[0];
        const res = await fetch("/api/import/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: assignment.sessionName ?? track.name,
            description: track.description,
            dateFrom: track.dateFrom.toISOString(),
            dateTo: track.dateTo?.toISOString(),
            routeCoordinates: track.routeCoordinates,
          }),
        });
        if (!res.ok) throw new Error("Begehung konnte nicht angelegt werden.");
        const data = await res.json();
        fieldSessionId = data.fieldSession.id;
        sessionCreated = true;
        sessionName = data.fieldSession.name;
        sessionId = data.fieldSession.id;
      } else if (assignment.mode === "new" && assignment.sessionName) {
        // Manually created session — no GPX route
        const res = await fetch("/api/field-sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: assignment.sessionName,
            namingScheme: assignment.sessionNamingScheme || null,
            dateFrom: new Date().toISOString(),
          }),
        });
        if (!res.ok) throw new Error("Begehung konnte nicht angelegt werden.");
        const data = await res.json();
        fieldSessionId = data.fieldSession.id;
        sessionCreated = true;
        sessionName = data.fieldSession.name;
        sessionId = data.fieldSession.id;
      } else if (assignment.mode === "existing" && assignment.existingSessionId) {
        fieldSessionId = assignment.existingSessionId;
        sessionId = assignment.existingSessionId;
        // Look up the session name for the result screen
        sessionName =
          existingSessions.find((s) => s.id === assignment.existingSessionId)?.name;
      }

      // ── 2. Upload images for geotagged photo findings ──
      const selectedFindings = parsed.findings.filter((f) =>
        selectedFindingIds.has(f._id)
      );
      const findingsWithImageIds = await uploadImages(selectedFindings);

      // ── 3. Import findings ──
      const payload = findingsWithImageIds.map((f) => ({
        lat: f.lat,
        lng: f.lng,
        name: f.name,
        description: f.description,
        foundAt: f.foundAt?.toISOString(),
        depth: f.depth,
        conductivity: f.conductivity,
        fieldSessionId,
        imageId: (f as FindingImport & { _uploadedImageId?: string })._uploadedImageId,
      }));

      const findingsRes = await fetch("/api/import/findings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ findings: payload }),
      });

      if (!findingsRes.ok) throw new Error("Import fehlgeschlagen.");
      const findingsData = await findingsRes.json();

      setResult({
        sessionCreated,
        sessionName: sessionCreated ? sessionName : undefined,
        sessionId: sessionCreated ? sessionId : undefined,
        linkedSessionName: assignment.mode === "existing" ? sessionName : undefined,
        linkedSessionId: assignment.mode === "existing" ? sessionId : undefined,
        created: findingsData.created,
        duplicates: findingsData.duplicates ?? [],
        errors: findingsData.errors ?? [],
      });
      setStep("done");
    } catch (err) {
      setResult({
        sessionCreated: false,
        created: 0,
        duplicates: [],
        errors: [{ index: 0, message: err instanceof Error ? err.message : "Unbekannter Fehler" }],
      });
      setStep("done");
    } finally {
      setImporting(false);
    }
  }

  function handleReset() {
    setParsed(null);
    setFileName("");
    setSelectedFindingIds(new Set());
    setAssignment({ mode: "none" });
    setResult(null);
    setStep("upload");
  }

  const stepLabels: Record<Step, string> = {
    upload: "Datei wählen",
    preview: "Vorschau",
    done: "Fertig",
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6 text-sm text-muted-foreground">
        {(["upload", "preview", "done"] as Step[]).map((s, i) => (
          <span key={s} className="flex items-center gap-2">
            {i > 0 && <span className="text-border">›</span>}
            <span className={step === s ? "text-foreground font-medium" : ""}>
              {stepLabels[s]}
            </span>
          </span>
        ))}
      </div>

      <Card className="p-6 bg-white border">
        {step === "upload" && (
          <UploadStep onParsed={handleParsed} />
        )}

        {step === "preview" && parsed && (
          <>
            <p className="text-xs text-muted-foreground mb-4">
              Datei: <span className="font-medium text-foreground">{fileName}</span>
              {" · "}
              {parsed.sessions.length > 0 && `${parsed.sessions.length} Track · `}
              {parsed.findings.length} Wegpunkt{parsed.findings.length !== 1 ? "e" : ""}
            </p>
            <PreviewStep
              sessions={parsed.sessions}
              findings={parsed.findings}
              selectedFindingIds={selectedFindingIds}
              onToggleFinding={handleToggleFinding}
              onToggleAllFindings={handleToggleAll}
              assignment={assignment}
              onAssignmentChange={setAssignment}
              existingSessions={existingSessions}
              onBack={handleReset}
              onImport={handleImport}
              importing={importing}
            />
          </>
        )}

        {step === "done" && result && (
          <ConfirmStep result={result} onReset={handleReset} />
        )}
      </Card>
    </div>
  );
}

/** Upload imageFile to Cloudinary for each finding that has one.
 *  Converts HEIC → JPEG and resizes to max 1920px before uploading.
 *  Attaches `_uploadedImageId` to the returned finding.
 */
async function uploadImages(
  findings: FindingImport[]
): Promise<(FindingImport & { _uploadedImageId?: string })[]> {
  const { prepareImageForUpload } = await import("./parsers/parseImages");

  return Promise.all(
    findings.map(async (f) => {
      if (!f.imageFile) return f;
      try {
        const prepared = await prepareImageForUpload(f.imageFile);
        const formData = new FormData();
        formData.append("file", prepared);
        const res = await fetch("/api/images", { method: "POST", body: formData });
        if (!res.ok) return f;
        const data = await res.json();
        // /api/images POST returns the image object directly (not wrapped)
        return { ...f, _uploadedImageId: data.id as string | undefined };
      } catch {
        return f;
      }
    })
  );
}
