"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus } from "lucide-react";

export interface NewSessionData {
  name: string;
  namingScheme: string;
}

interface Props {
  /** Called when the user submits. Return a Promise to show a loading state. */
  onSubmit: (data: NewSessionData) => void | Promise<void>;
  submitLabel?: string;
  defaultName?: string;
  /** Controlled loading state override — if omitted, managed internally. */
  loading?: boolean;
}

/** Reusable inline form for creating a new field session (name + optional naming scheme).
 *  Used in the field-view ActiveSessionBar and in the import wizard.
 */
export default function NewSessionInlineForm({
  onSubmit,
  submitLabel = "Session starten",
  defaultName = "",
  loading: externalLoading,
}: Props) {
  const [name, setName] = useState(defaultName);
  const [scheme, setScheme] = useState("");
  const [internalLoading, setInternalLoading] = useState(false);

  const loading = externalLoading ?? internalLoading;

  async function handleSubmit() {
    if (!name.trim()) return;
    const result = onSubmit({ name: name.trim(), namingScheme: scheme.trim() });
    if (result instanceof Promise) {
      setInternalLoading(true);
      try {
        await result;
      } finally {
        setInternalLoading(false);
      }
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Input
        placeholder="Name der Begehung"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
      />
      <Input
        placeholder="Benennungsschema (optional), z. B. {session}-{n:03}"
        value={scheme}
        onChange={(e) => setScheme(e.target.value)}
      />
      <p className="text-xs text-muted-foreground">
        Tokens: <code className="bg-muted px-1 rounded">{"{session}"}</code>{" "}
        <code className="bg-muted px-1 rounded">{"{n:03}"}</code>{" "}
        <code className="bg-muted px-1 rounded">{"{date}"}</code>
      </p>
      <Button onClick={handleSubmit} disabled={loading || !name.trim()}>
        {loading ? (
          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
        ) : (
          <Plus className="h-4 w-4 mr-1" />
        )}
        {submitLabel}
      </Button>
    </div>
  );
}
