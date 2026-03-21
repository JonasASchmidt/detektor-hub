/**
 * Coordinate system transformation utilities using proj4.
 *
 * ETRS89 and WGS84 are practically identical for European use (difference < 1 m),
 * so WGS84 input coordinates are treated as ETRS89 for projection purposes.
 *
 * Supported target systems:
 *   UTM32N (EPSG:25832) — used by most western/central German states
 *   UTM33N (EPSG:25833) — used by Saxony, Brandenburg, Berlin, Mecklenburg-VP
 */

import proj4 from "proj4";

export type CoordinateSystem = "WGS84" | "UTM32" | "UTM33";

export const COORDINATE_SYSTEM_LABELS: Record<CoordinateSystem, string> = {
  WGS84: "WGS84 (GPS)",
  UTM32: "ETRS89 / UTM Zone 32N",
  UTM33: "ETRS89 / UTM Zone 33N",
};

// Register ETRS89/UTM projections by their EPSG codes
proj4.defs("EPSG:25832", "+proj=utm +zone=32 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");
proj4.defs("EPSG:25833", "+proj=utm +zone=33 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");

const WGS84 = "EPSG:4326";

const CRS_TO_EPSG: Record<Exclude<CoordinateSystem, "WGS84">, string> = {
  UTM32: "EPSG:25832",
  UTM33: "EPSG:25833",
};

export interface UTMCoordinate {
  easting: number;
  northing: number;
  zone: number;
}

/**
 * Convert WGS84 decimal degrees to UTM easting/northing via proj4.
 * proj4 expects [longitude, latitude] order.
 */
export function wgs84ToUTM(lat: number, lng: number, crs: Exclude<CoordinateSystem, "WGS84">): UTMCoordinate {
  const epsg = CRS_TO_EPSG[crs];
  const [easting, northing] = proj4(WGS84, epsg, [lng, lat]);
  const zone = crs === "UTM32" ? 32 : 33;
  return {
    easting: Math.round(easting * 100) / 100,
    northing: Math.round(northing * 100) / 100,
    zone,
  };
}

/**
 * Format UTM coordinates as a human-readable string.
 * Example: "33U 411234 5640123"
 *
 * The UTM letter band is approximated from northing; Germany spans U (mostly) and T in the far south.
 */
export function formatUTM(utm: UTMCoordinate): string {
  const band = utm.northing >= 5000000 ? "U" : "T";
  return `${utm.zone}${band} ${Math.round(utm.easting)} ${Math.round(utm.northing)}`;
}

/**
 * Convert WGS84 coordinates and return a display string for the given coordinate system.
 */
export function formatCoordinates(lat: number, lng: number, system: CoordinateSystem): string {
  if (system === "WGS84") {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }
  const utm = wgs84ToUTM(lat, lng, system);
  return formatUTM(utm);
}
