"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: Props) {
  const { data: session, update } = useSession();

  const [name, setName] = useState(session?.user?.name ?? "");
  const [nameSaving, setNameSaving] = useState(false);
  const [nameError, setNameError] = useState("");
  const [nameSuccess, setNameSuccess] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    setNameError("");
    setNameSuccess(false);
    if (!name.trim()) { setNameError("Name erforderlich."); return; }
    setNameSaving(true);
    const res = await fetch("/api/user", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    const data = await res.json();
    setNameSaving(false);
    if (!res.ok) { setNameError(data.error ?? "Fehler beim Speichern."); return; }
    await update({ name: name.trim() });
    setNameSuccess(true);
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError("");
    setPwSuccess(false);
    if (newPassword !== confirmPassword) { setPwError("Passwörter stimmen nicht überein."); return; }
    setPwSaving(true);
    const res = await fetch("/api/user", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json();
    setPwSaving(false);
    if (!res.ok) { setPwError(data.error ?? "Fehler beim Speichern."); return; }
    setPwSuccess(true);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Einstellungen</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {/* Name */}
          <form onSubmit={saveName} className="space-y-3">
            <h3 className="text-sm font-semibold">Benutzername</h3>
            <div className="space-y-1.5">
              <Label htmlFor="settings-name">Name</Label>
              <Input
                id="settings-name"
                value={name}
                onChange={(e) => { setName(e.target.value); setNameSuccess(false); }}
                placeholder="Dein Name"
              />
            </div>
            {nameError && <p className="text-sm text-destructive">{nameError}</p>}
            {nameSuccess && <p className="text-sm text-green-600">Name gespeichert.</p>}
            <Button type="submit" size="sm" disabled={nameSaving}>
              {nameSaving ? "Speichern…" : "Name speichern"}
            </Button>
          </form>

          <Separator />

          {/* Password */}
          <form onSubmit={savePassword} className="space-y-3">
            <h3 className="text-sm font-semibold">Passwort ändern</h3>
            <div className="space-y-1.5">
              <Label htmlFor="settings-current-pw">Aktuelles Passwort</Label>
              <Input
                id="settings-current-pw"
                type="password"
                value={currentPassword}
                onChange={(e) => { setCurrentPassword(e.target.value); setPwSuccess(false); }}
                autoComplete="current-password"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="settings-new-pw">Neues Passwort</Label>
              <Input
                id="settings-new-pw"
                type="password"
                value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); setPwSuccess(false); }}
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="settings-confirm-pw">Passwort bestätigen</Label>
              <Input
                id="settings-confirm-pw"
                type="password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setPwSuccess(false); }}
                autoComplete="new-password"
              />
            </div>
            {pwError && <p className="text-sm text-destructive">{pwError}</p>}
            {pwSuccess && <p className="text-sm text-green-600">Passwort geändert.</p>}
            <Button type="submit" size="sm" disabled={pwSaving}>
              {pwSaving ? "Speichern…" : "Passwort ändern"}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
