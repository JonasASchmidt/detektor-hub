/** Convert Leaflet [lat,lng][] → GeoJSON Polygon string (GeoJSON uses [lng,lat]) */
export function toGeoJSON(coords: [number, number][]): string {
  if (coords.length < 3) return "";
  const ring = [...coords.map(([lat, lng]) => [lng, lat]), [coords[0][1], coords[0][0]]];
  return JSON.stringify({ type: "Polygon", coordinates: [ring] });
}

/** Convert GeoJSON Polygon string → Leaflet [lat,lng][] */
export function fromGeoJSON(geoJson: string): [number, number][] {
  try {
    const parsed = JSON.parse(geoJson);
    return (parsed.coordinates[0] as [number, number][])
      .slice(0, -1)
      .map(([lng, lat]) => [lat, lng]);
  } catch {
    return [];
  }
}

/** Ray-casting point-in-polygon check. Polygon vertices are [lat,lng]. */
export function pointInPolygon(lat: number, lng: number, polygon: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [yi, xi] = polygon[i];
    const [yj, xj] = polygon[j];
    if ((yi > lat) !== (yj > lat) && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

// ---------------------------------------------------------------------------
// Administrative unit lookup (PostGIS)
// ---------------------------------------------------------------------------

import prisma from "@/lib/prisma";

export interface AdminUnits {
  adminCountry: string | null;
  adminFederalState: string | null;
  adminCounty: string | null;
  adminMunicipality: string | null;
}

const NULL_ADMIN_UNITS: AdminUnits = {
  adminCountry: null,
  adminFederalState: null,
  adminCounty: null,
  adminMunicipality: null,
};

/**
 * Looks up German administrative units for the given WGS84 coordinates via PostGIS.
 * Returns all-null if the point is outside Germany or the DB tables are not yet populated.
 */
export async function lookupAdminUnits(lat: number, lng: number): Promise<AdminUnits> {
  type Row = { country: string; federal_state: string; county: string; municipality: string };
  let rows: Row[];

  try {
    rows = await prisma.$queryRaw`
      WITH
        country AS (
          SELECT id_country, name AS "country"
          FROM public."administrative_units_country"
          WHERE ST_Intersects(geometry, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326))
        ),
        federal_state AS (
          SELECT id_country, country, id_federal_state, name AS "federal_state"
          FROM public.administrative_units_federal_states states
          JOIN country USING (id_country)
          WHERE ST_Intersects(states.geometry, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326))
        ),
        county AS (
          SELECT id_country, country, id_federal_state, federal_state, id_county, name AS "county"
          FROM public.administrative_units_counties AS counties
          JOIN federal_state USING (id_federal_state)
          WHERE ST_Intersects(counties.geometry, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326))
        ),
        municipality AS (
          SELECT country, federal_state, county, name AS "municipality"
          FROM public.administrative_units_municipalities AS municipalities
          JOIN county USING (id_county)
          WHERE ST_Intersects(municipalities.geometry, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326))
        )
      SELECT country, federal_state, county, municipality FROM municipality
    `;
  } catch {
    return NULL_ADMIN_UNITS;
  }

  if (rows.length === 0) return NULL_ADMIN_UNITS;

  const row = rows[0];
  return {
    adminCountry: row.country ?? null,
    adminFederalState: row.federal_state ?? null,
    adminCounty: row.county ?? null,
    adminMunicipality: row.municipality ?? null,
  };
}
