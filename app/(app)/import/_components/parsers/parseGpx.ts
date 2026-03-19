import { gpx } from "@tmcw/togeojson";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import type { FindingImport, SessionImport, ParsedImport } from "./types";

/** Parse a GPX file string into normalized sessions and findings.
 *  - <trk> elements become SessionImport (with route coordinates)
 *  - <wpt> elements become FindingImport
 */
export function parseGpxFile(content: string): ParsedImport {
  const dom = new DOMParser().parseFromString(content, "text/xml");

  // DOMParser sets a <parsererror> element on failure
  if (dom.querySelector("parsererror")) {
    throw new Error("Ungültige GPX-Datei — XML konnte nicht gelesen werden.");
  }

  const geojson: FeatureCollection = gpx(dom);

  const sessions: SessionImport[] = [];
  const findings: FindingImport[] = [];

  for (const feature of geojson.features as Feature<Geometry>[]) {
    if (!feature.geometry) continue;
    const props = feature.properties ?? {};

    if (feature.geometry.type === "Point") {
      // <wpt> → Finding
      const [lng, lat] = feature.geometry.coordinates as number[];
      findings.push({
        _id: crypto.randomUUID(),
        _source: "gpx",
        lat,
        lng,
        name: props.name ?? undefined,
        description: props.desc ?? undefined,
        foundAt: props.time ? new Date(props.time as string) : undefined,
      });
    } else if (
      feature.geometry.type === "LineString" ||
      feature.geometry.type === "MultiLineString"
    ) {
      // <trk> → Session
      const coords = extractLineCoords(feature.geometry);
      const times = extractCoordTimes(props);

      const dateFrom = times[0] ? new Date(times[0]) : new Date();
      const dateTo = times[times.length - 1]
        ? new Date(times[times.length - 1])
        : undefined;

      sessions.push({
        _id: crypto.randomUUID(),
        _source: "gpx",
        name: (props.name as string | undefined) ?? "GPX-Begehung",
        description: (props.desc as string | undefined) ?? undefined,
        dateFrom,
        // Only set dateTo if it differs from dateFrom (avoids 0-duration sessions)
        dateTo:
          dateTo && dateTo.getTime() !== dateFrom.getTime()
            ? dateTo
            : undefined,
        routeCoordinates: coords,
      });
    }
  }

  return { sessions, findings };
}

/** Flatten LineString or MultiLineString coordinates into [lng, lat] pairs. */
function extractLineCoords(
  geometry: { type: string; coordinates: unknown }
): [number, number][] {
  if (geometry.type === "LineString") {
    return (geometry.coordinates as number[][]).map(
      ([lng, lat]) => [lng, lat] as [number, number]
    );
  }
  // MultiLineString: flatten all segments
  return (geometry.coordinates as number[][][])
    .flat()
    .map(([lng, lat]) => [lng, lat] as [number, number]);
}

/** Extract flat coord-time array from togeojson feature properties.
 *  togeojson puts times in `coordTimes` (string[] for LineString, string[][] for MultiLineString).
 */
function extractCoordTimes(props: Record<string, unknown>): string[] {
  const raw = props.coordTimes;
  if (!raw) return [];
  if (Array.isArray(raw)) {
    // LineString: string[]  or  MultiLineString: string[][]
    if (typeof raw[0] === "string") return raw as string[];
    if (Array.isArray(raw[0])) return (raw as string[][]).flat();
  }
  return [];
}
