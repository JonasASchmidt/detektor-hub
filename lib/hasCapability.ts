import prisma from "@/lib/prisma";
import { Capability } from "@/lib/capabilities";

// Geographic context used to scope a capability check.
// Pass whichever fields describe the resource being acted on.
// If no context is given, the check succeeds as long as the user holds
// the capability in *any* of their roles (useful for nav/UI gating).
export interface CapabilityContext {
  adminFederalState?: string;
  adminCounty?: string;
  adminMunicipality?: string;
  // Provide coordinates when checking ZONE-scoped roles.
  // A PostGIS ST_Contains query is run to test containment.
  coordinates?: { lat: number; lng: number };
}

// Returns true if the user holds the given capability in any active role
// whose scope covers the provided context.
//
// Scope inheritance rules:
//   FEDERAL_STATE="Bayern"  covers any resource with adminFederalState="Bayern"
//   COUNTY="München"        covers any resource with adminCounty="München"
//   MUNICIPALITY="Schwabing" covers any resource with adminMunicipality="Schwabing"
//   ZONE=<id>               covers any resource whose coordinates fall within that zone's geometry
//
// A higher-level scope implicitly covers lower levels within it.
// E.g. a federal-state role covers all counties/municipalities in that state.
export async function hasCapability(
  userId: string,
  capability: Capability,
  context?: CapabilityContext
): Promise<boolean> {
  const now = new Date();

  // Load all active role assignments for this user where the role
  // contains the requested capability, including their scope bindings.
  const assignments = await prisma.userOfficialRole.findMany({
    where: {
      userId,
      officialRole: {
        capabilities: { has: capability },
      },
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    include: {
      officialRole: {
        include: { scope: true },
      },
    },
  });

  if (assignments.length === 0) return false;

  // No context = caller only needs to know if the capability exists anywhere
  if (!context) return true;

  const { adminFederalState, adminCounty, adminMunicipality, coordinates } =
    context;

  // Collect zone IDs from ZONE-scoped roles so we can do a single PostGIS query
  const zoneIds: string[] = [];

  for (const assignment of assignments) {
    for (const scope of assignment.officialRole.scope) {
      switch (scope.adminUnitType) {
        case "FEDERAL_STATE":
          // Federal state scope covers everything within that state
          if (adminFederalState && scope.adminUnitName === adminFederalState)
            return true;
          break;

        case "COUNTY":
          // County scope covers municipalities within the county
          if (adminCounty && scope.adminUnitName === adminCounty) return true;
          break;

        case "MUNICIPALITY":
          if (
            adminMunicipality &&
            scope.adminUnitName === adminMunicipality
          )
            return true;
          break;

        case "ZONE":
          if (scope.zoneId && coordinates) zoneIds.push(scope.zoneId);
          break;
      }
    }
  }

  // Check zone containment via PostGIS if we have zones and coordinates
  if (zoneIds.length > 0 && coordinates) {
    const { lat, lng } = coordinates;
    const result = await prisma.$queryRaw<{ found: boolean }[]>`
      SELECT EXISTS (
        SELECT 1
        FROM "Zone" z
        WHERE z.id = ANY(${zoneIds}::uuid[])
          AND z.geometry IS NOT NULL
          AND ST_Contains(
            z.geometry,
            ST_SetSRID(ST_Point(${lng}, ${lat}), 4326)
          )
      ) AS found
    `;
    if (result[0]?.found) return true;
  }

  return false;
}

// Returns the highest-priority role assignment for a user (for badge display).
// "Highest priority" = largest priority value.
export async function getPrimaryRole(userId: string) {
  const now = new Date();

  const assignment = await prisma.userOfficialRole.findFirst({
    where: {
      userId,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    orderBy: { officialRole: { priority: "desc" } },
    include: {
      officialRole: {
        select: {
          id: true,
          name: true,
          badgeLabel: true,
          badgeColor: true,
          priority: true,
        },
      },
    },
  });

  return assignment?.officialRole ?? null;
}
