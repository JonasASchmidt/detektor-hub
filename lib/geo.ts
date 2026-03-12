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
