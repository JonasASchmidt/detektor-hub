"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PencilIcon, Trash2Icon, UsersIcon } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ADMIN_UNIT_TYPE_LABELS } from "@/schemas/official-role";

interface Scope {
  id: string;
  adminUnitType: string;
  adminUnitName: string | null;
}

interface Role {
  id: string;
  name: string;
  description: string | null;
  badgeLabel: string | null;
  badgeColor: string | null;
  priority: number;
  capabilities: string[];
  createdByUserId: string;
  scope: Scope[];
  _count: { userRoles: number };
}

interface Props {
  roles: Role[];
  currentUserId: string;
  isAdmin: boolean;
}

export default function RolesList({ roles: initialRoles, currentUserId, isAdmin }: Props) {
  const router = useRouter();
  const [roles, setRoles] = useState(initialRoles);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  function canEdit(role: Role) {
    return isAdmin || role.createdByUserId === currentUserId;
  }

  async function confirmDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/official-roles/${deleteId}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json();
        toast.error(body.error ?? "Fehler beim Löschen");
        return;
      }
      setRoles((prev) => prev.filter((r) => r.id !== deleteId));
      toast.success("Rolle gelöscht");
      router.refresh();
    } catch {
      toast.error("Netzwerkfehler");
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  }

  if (roles.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Noch keine Rollen vorhanden. Erstelle die erste Rolle.
      </p>
    );
  }

  return (
    <>
      <ul className="space-y-3">
        {roles.map((role) => (
          <li
            key={role.id}
            className="rounded-xl border bg-card p-4 flex flex-col sm:flex-row sm:items-start gap-3"
          >
            {/* Left: info */}
            <div className="flex-1 space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold">{role.name}</span>
                {role.badgeLabel && (
                  <span
                    className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium text-white"
                    style={{ backgroundColor: role.badgeColor ?? "#2d2d2d" }}
                  >
                    {role.badgeLabel}
                  </span>
                )}
                <span className="text-xs text-muted-foreground">
                  Priorität {role.priority}
                </span>
              </div>

              {role.description && (
                <p className="text-sm text-muted-foreground">{role.description}</p>
              )}

              {/* Scopes */}
              <div className="flex flex-wrap gap-1 pt-0.5">
                {role.scope.map((s) => (
                  <span
                    key={s.id}
                    className="text-xs rounded-md border px-2 py-0.5 bg-muted"
                  >
                    <span className="text-muted-foreground mr-1">
                      {ADMIN_UNIT_TYPE_LABELS[s.adminUnitType]}
                    </span>
                    {s.adminUnitName}
                  </span>
                ))}
              </div>

              {/* Capabilities + member count */}
              <div className="flex items-center gap-3 text-xs text-muted-foreground pt-0.5">
                <span>{role.capabilities.length} Berechtigung{role.capabilities.length !== 1 ? "en" : ""}</span>
                <span className="flex items-center gap-1">
                  <UsersIcon className="h-3 w-3" />
                  {role._count.userRoles} Mitglied{role._count.userRoles !== 1 ? "er" : ""}
                </span>
              </div>
            </div>

            {/* Right: actions */}
            {canEdit(role) && (
              <div className="flex gap-2 shrink-0">
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="h-8 border-2 border-foreground hover:bg-[#2d2d2d] hover:text-white hover:border-[#2d2d2d]"
                >
                  <Link href={`/management/roles/${role.id}/edit`}>
                    <PencilIcon className="h-3.5 w-3.5" />
                    Bearbeiten
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 border-2 border-foreground hover:bg-destructive hover:text-white hover:border-destructive"
                  onClick={() => setDeleteId(role.id)}
                >
                  <Trash2Icon className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </li>
        ))}
      </ul>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rolle löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Die Rolle wird unwiderruflich gelöscht und allen Benutzern entzogen, denen sie zugewiesen wurde.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={deleting}>
              {deleting ? "Wird gelöscht…" : "Löschen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
