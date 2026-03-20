import { z } from "zod";
import { CAPABILITIES } from "@/lib/capabilities";

export const scopeSchema = z.object({
  adminUnitType: z.enum(["FEDERAL_STATE", "COUNTY", "MUNICIPALITY"]),
  adminUnitName: z.string().min(1, "Verwaltungseinheit angeben"),
});

export const officialRoleSchema = z.object({
  name: z.string().min(1, "Name wird benötigt").max(100),
  description: z.string().optional().nullable(),
  badgeLabel: z.string().max(20, "Max. 20 Zeichen").optional().nullable(),
  // Empty string treated as null (no color)
  badgeColor: z
    .string()
    .regex(/^(#[0-9a-fA-F]{6})?$/, "Ungültiges Format (z.B. #2d2d2d)")
    .optional()
    .nullable()
    .transform((v) => (v === "" ? null : v)),
  priority: z.coerce.number().int().min(0).max(999),
  capabilities: z
    .array(z.enum(CAPABILITIES))
    .min(1, "Mindestens eine Berechtigung wählen"),
  scopes: z.array(scopeSchema).min(1, "Mindestens einen Bereich angeben"),
});

export type OfficialRoleFormData = z.infer<typeof officialRoleSchema>;

// German labels for each capability — used in form UI
export const CAPABILITY_LABELS: Record<
  (typeof CAPABILITIES)[number],
  string
> = {
  MANAGE_ROLES: "Rollen verwalten",
  MANAGE_USERS: "Benutzer verwalten",
  VIEW_USER_DATA: "Benutzerdaten einsehen (PII)",
  GRANT_PERMISSION: "Genehmigungen erteilen",
  ASSIGN_ZONES: "Zonen zuweisen",
  MODERATE_COMMUNITY: "Community moderieren",
  VIEW_ALL_FINDINGS: "Alle Funde einsehen",
  VIEW_FINDING_LOCATIONS: "Fundorte einsehen",
};

// German labels for admin unit types — used in form UI
export const ADMIN_UNIT_TYPE_LABELS: Record<string, string> = {
  FEDERAL_STATE: "Bundesland",
  COUNTY: "Landkreis",
  MUNICIPALITY: "Gemeinde",
};
