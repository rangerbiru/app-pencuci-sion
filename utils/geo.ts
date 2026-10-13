import type { Coords } from '@/services/fieldActions';

const EARTH_RADIUS_M = 6371000;
const rad = (deg: number) => (deg * Math.PI) / 180;

/** Jarak dua titik di permukaan bumi (haversine), dalam meter. */
export function distanceMeters(a: Coords, b: Coords): number {
  const dLat = rad(b.latitude - a.latitude);
  const dLng = rad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

export interface WorkPlace {
  latitude?: number | null;
  longitude?: number | null;
  radius_m?: number | null;
}

export interface LocationVerdict {
  inside: boolean;
  /** dibulatkan ke meter */
  distance: number;
}

/**
 * Perkiraan di lokasi / di luar lokasi sebelum absen. Hanya bila server mengirim koordinat lokasi
 * kerja dan radius (lokasi sendiri, atau `settings.attendance_radius_m`); selain itu `null` dan
 * penentuan diserahkan ke server. Keputusan akhir tetap `location_flag` dari server.
 */
export function locationVerdict(
  coords: Coords,
  place: WorkPlace | null | undefined,
  fallbackRadius?: number | null,
): LocationVerdict | null {
  if (place?.latitude == null || place.longitude == null) return null;
  const radius = place.radius_m ?? fallbackRadius;
  if (!radius) return null;
  const distance = Math.round(
    distanceMeters(coords, { latitude: place.latitude, longitude: place.longitude }),
  );
  return { inside: distance <= radius, distance };
}
