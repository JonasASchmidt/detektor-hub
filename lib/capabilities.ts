// Exhaustive list of capabilities that can be granted via OfficialRole.
// This is the single source of truth — OfficialRole.capabilities in the DB
// stores a subset of these strings. Never add capabilities only to the DB;
// always add them here first so API checks remain type-safe.

export const CAPABILITIES = [
  // Role administration within own admin unit scope
  "MANAGE_ROLES",

  // View user list and their data (including decrypted UserProfile) in admin unit
  "MANAGE_USERS",

  // Decrypt and read UserProfile PII (firstName, lastName, address, birthdate)
  // Separate from MANAGE_USERS so a moderator can see users but not their PII
  "VIEW_USER_DATA",

  // Review and approve/reject detecting permission applications
  "GRANT_PERMISSION",

  // Create and assign search zones (Zone model) for users in admin unit
  "ASSIGN_ZONES",

  // Hide/remove community comments, moderate discussions in admin unit
  "MODERATE_COMMUNITY",

  // See all findings (including DRAFT and non-public) for users in admin unit
  "VIEW_ALL_FINDINGS",

  // See exact coordinates of findings in admin unit (normally hidden for privacy)
  "VIEW_FINDING_LOCATIONS",
] as const;

export type Capability = (typeof CAPABILITIES)[number];

// Type guard — useful when reading capabilities from DB strings
export function isCapability(value: string): value is Capability {
  return CAPABILITIES.includes(value as Capability);
}
