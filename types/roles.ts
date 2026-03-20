import { Capability } from "@/lib/capabilities";

// Mirrors the AdminUnitType Prisma enum
export type AdminUnitType =
  | "FEDERAL_STATE"
  | "COUNTY"
  | "MUNICIPALITY"
  | "ZONE";

export interface OfficialRoleScope {
  id: string;
  adminUnitType: AdminUnitType;
  adminUnitName: string | null; // set for FEDERAL_STATE | COUNTY | MUNICIPALITY
  zoneId: string | null;        // set for ZONE
}

export interface OfficialRole {
  id: string;
  name: string;
  description: string | null;
  capabilities: Capability[];
  badgeLabel: string | null;
  badgeColor: string | null;
  priority: number;
  createdByUserId: string;
  createdAt: Date;
  updatedAt: Date;
  scope: OfficialRoleScope[];
}

// Minimal badge info — used when rendering username badges
export interface RoleBadge {
  label: string;
  color: string | null;
}

// The shape returned by getPrimaryRole() in lib/hasCapability.ts
export interface PrimaryRole {
  id: string;
  name: string;
  badgeLabel: string | null;
  badgeColor: string | null;
  priority: number;
}
