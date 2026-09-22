export interface CampusGeofence {
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
}

export const CAMPUS_GEOFENCE: CampusGeofence = {
  name: "Futurex Learning Central Campus",
  latitude: 28.6139,
  longitude: 77.209,
  radiusMeters: 250, // 250 meters campus perimeter
};

export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

