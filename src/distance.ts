import { Coordinates } from './state/State'

export default function distanceEntreDeuxPoints({ latitude: lat1, longitude: lon1 }: Coordinates, { latitude: lat2, longitude: lon2 }: Coordinates) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2-lat1);  // deg2rad below
  const dLon = deg2rad(lon2-lon1);
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const kilometers = R * c; // Distance in km
  return kilometers;
}

function deg2rad(deg: number) {
  return deg * (Math.PI/180)
}
