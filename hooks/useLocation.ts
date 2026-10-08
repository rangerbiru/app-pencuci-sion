import { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import type { Coords } from '@/services/fieldActions';

export type LocationState =
  | { status: 'loading' }
  | { status: 'ok'; coords: Coords }
  | { status: 'denied' }
  | { status: 'unavailable' };

/**
 * Lokasi untuk absen (opsional di API). Gagal membaca lokasi tidak menghalangi absen;
 * server menandainya "Tanpa Lokasi".
 */
export default function useLocation(): LocationState {
  const [state, setState] = useState<LocationState>({ status: 'loading' });
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const perm = await Location.requestForegroundPermissionsAsync();
        if (!perm.granted) {
          if (!cancelled) setState({ status: 'denied' });
          return;
        }
        const last = await Location.getLastKnownPositionAsync({ maxAge: 120000 });
        if (last && !cancelled) {
          setState({
            status: 'ok',
            coords: { latitude: last.coords.latitude, longitude: last.coords.longitude },
          });
        }
        const pos = await Promise.race([
          Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
          new Promise<null>(resolve => setTimeout(() => resolve(null), 15000)),
        ]);
        if (cancelled) return;
        if (pos)
          setState({
            status: 'ok',
            coords: { latitude: pos.coords.latitude, longitude: pos.coords.longitude },
          });
        else if (!last) setState({ status: 'unavailable' });
      } catch {
        if (!cancelled) setState({ status: 'unavailable' });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  return state;
}
