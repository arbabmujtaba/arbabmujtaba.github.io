/**
 * The places on the memory map. Coordinates are real (decimal degrees); the
 * memories attached to each place are found in the archive by name, never
 * written here.
 */

export interface Place {
  id: string;
  name: string;
  lat: number;
  lon: number;
  /** One of the two cities the timeline is set in, or a place visited from one. */
  kind: 'home' | 'visited';
  /** Words that mean this place when they appear in an entry. */
  keywords: string[];
  /** Which city it hangs off on the map. */
  region: 'valley' | 'malwa';
}

export const PLACES: Place[] = [
  { id: 'sopore', name: 'Sopore', lat: 34.3, lon: 74.47, kind: 'home', keywords: ['sopore'], region: 'valley' },
  { id: 'wular', name: 'Wular', lat: 34.36, lon: 74.6, kind: 'visited', keywords: ['wular'], region: 'valley' },
  { id: 'gulmarg', name: 'Gulmarg', lat: 34.05, lon: 74.38, kind: 'visited', keywords: ['gulmarg'], region: 'valley' },
  { id: 'srinagar', name: 'Srinagar', lat: 34.08, lon: 74.8, kind: 'visited', keywords: ['srinagar'], region: 'valley' },
  { id: 'pahalgam', name: 'Pahalgam', lat: 34.01, lon: 75.32, kind: 'visited', keywords: ['pahalgam'], region: 'valley' },
  { id: 'indore', name: 'Indore', lat: 22.72, lon: 75.86, kind: 'home', keywords: ['indore', '22.6639', '75.8827'], region: 'malwa' },
];

/** Great-circle distance in km. */
export function distanceKm(a: Pick<Place, 'lat' | 'lon'>, b: Pick<Place, 'lat' | 'lon'>): number {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

export function formatLat(lat: number) {
  return `${Math.abs(lat).toFixed(2)}° ${lat >= 0 ? 'N' : 'S'}`;
}
export function formatLon(lon: number) {
  return `${Math.abs(lon).toFixed(2)}° ${lon >= 0 ? 'E' : 'W'}`;
}
