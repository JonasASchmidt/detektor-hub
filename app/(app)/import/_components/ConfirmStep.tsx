"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircleIcon, AlertTriangleIcon, XCircleIcon, MapPinIcon, RouteIcon } from "lucide-react";
import Link from "next/link";

export interface ImportResult {
  sessionCreated: boolean;
  sessionName?: string;
  sessionId?: string;
  /** Set when findings were added to an already-existing session. */
  linkedSessionName?: string;
  linkedSessionId?: string;
  created: number;
  duplicates: number[];
  errors: { index: number; message: string }[];
}

interface Props {
  result: ImportResult;
  onReset: () => void;
}

export default function ConfirmStep({ result, onReset }: Props) {
  const hasErrors = result.errors.length > 0;
  const hasDuplicates = result.duplicates.length > 0;

  return (
    <div className="flex flex-col gap-5">
      <div className="text-center">
        {hasErrors && result.created === 0 ? (
          <XCircleIcon className="h-12 w-12 text-destructive mx-auto mb-2" />
        ) : (
          <CheckCircleIcon className="h-12 w-12 text-green-600 mx-auto mb-2" />
        )}
        <h2 className="text-xl font-bold">
          {hasErrors && result.created === 0
            ? "Import fehlgeschlagen"
            : "Import abgeschlossen"}
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {/* New session created */}
        {result.sessionCreated && (
          <Card className="flex items-center gap-3 p-4 bg-white border">
            <RouteIcon className="h-5 w-5 text-green-600 shrink-0" />
            <div>
              <p className="text-sm font-medium">
                Begehung angelegt: {result.sessionName}
              </p>
              {result.sessionId && (
                <Link
                  href={`/sessions/${result.sessionId}`}
                  className="text-xs text-muted-foreground underline underline-offset-2"
                >
                  Begehung öffnen →
                </Link>
              )}
            </div>
          </Card>
        )}

        {/* Linked to existing session */}
        {result.linkedSessionName && (
          <Card className="flex items-center gap-3 p-4 bg-white border">
            <RouteIcon className="h-5 w-5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-sm font-medium">
                Begehung zugeordnet: {result.linkedSessionName}
              </p>
              {result.linkedSessionId && (
                <Link
                  href={`/sessions/${result.linkedSessionId}`}
                  className="text-xs text-muted-foreground underline underline-offset-2"
                >
                  Begehung öffnen →
                </Link>
              )}
            </div>
          </Card>
        )}

        {/* Created findings */}
        <Card className="flex items-center gap-3 p-4 bg-white border">
          <MapPinIcon className="h-5 w-5 text-green-600 shrink-0" />
          <p className="text-sm font-medium">
            {result.created} Fund{result.created !== 1 ? "e" : ""} importiert
          </p>
        </Card>

        {/* Duplicate warnings */}
        {hasDuplicates && (
          <Card className="flex items-center gap-3 p-4 bg-amber-50 border-amber-200 border">
            <AlertTriangleIcon className="h-5 w-5 text-amber-600 shrink-0" />
            <p className="text-sm text-amber-700">
              {result.duplicates.length} Fund{result.duplicates.length !== 1 ? "e haben" : " hat"} dieselben
              Koordinaten wie bestehende Funde — bitte prüfen.
            </p>
          </Card>
        )}

        {/* Errors */}
        {hasErrors && (
          <Card className="p-4 bg-red-50 border-red-200 border">
            <div className="flex items-center gap-2 mb-2">
              <XCircleIcon className="h-4 w-4 text-destructive shrink-0" />
              <p className="text-sm font-medium text-destructive">
                {result.errors.length} Fehler beim Import
              </p>
            </div>
            <ul className="text-xs text-destructive space-y-1 ml-6 list-disc">
              {result.errors.slice(0, 5).map((e) => (
                <li key={e.index}>
                  Fund {e.index + 1}: {e.message}
                </li>
              ))}
              {result.errors.length > 5 && (
                <li>… und {result.errors.length - 5} weitere</li>
              )}
            </ul>
          </Card>
        )}
      </div>

      <div className="flex gap-3">
        <Link href="/findings" className="flex-1">
          <Button
            variant="ghost"
            className="w-full border-2 border-foreground hover:bg-[#2d2d2d] hover:text-white hover:border-[#2d2d2d] font-bold"
          >
            Zu meinen Funden
          </Button>
        </Link>
        <Button
          variant="ghost"
          className="border-2 border-foreground hover:bg-[#2d2d2d] hover:text-white hover:border-[#2d2d2d] font-bold"
          onClick={onReset}
        >
          Weitere importieren
        </Button>
      </div>
    </div>
  );
}
