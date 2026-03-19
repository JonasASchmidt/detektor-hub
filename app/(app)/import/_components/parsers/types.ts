/** Normalized shape of a single finding to be imported. */
export interface FindingImport {
  /** Client-side temp ID for selection state. */
  _id: string;
  _source: "gpx" | "kml" | "image";
  lat: number;
  lng: number;
  name?: string;
  description?: string;
  foundAt?: Date;
  depth?: number;
  conductivity?: number;
  /** For geotagged image imports: the original File object (uploaded to Cloudinary before API call). */
  imageFile?: File;
  /** Object URL for thumbnail preview — only set for image imports. Revoke when done. */
  previewUrl?: string;
  /** Set during duplicate check: matches an existing finding at the same lat/lng. */
  _isDuplicate?: boolean;
}

/** Normalized shape of a session (from a GPX track) to be imported. */
export interface SessionImport {
  /** Client-side temp ID. */
  _id: string;
  _source: "gpx" | "kml";
  name: string;
  description?: string;
  dateFrom: Date;
  dateTo?: Date;
  /** GeoJSON LineString coordinates [lng, lat] (already in GeoJSON order). */
  routeCoordinates?: [number, number][];
}

/** Top-level result returned by all parsers. */
export interface ParsedImport {
  sessions: SessionImport[];
  /** Orphan findings — not yet assigned to a session. */
  findings: FindingImport[];
}
