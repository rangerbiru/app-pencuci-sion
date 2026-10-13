import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Linking } from 'react-native';
import * as Location from 'expo-location';
import type { Coords } from '@/services/fieldActions';
import { isAndroid, isWeb } from '@/utils/deviceInfo';

/** Batas waktu membaca lokasi; lewat dari ini dianggap sinyal GPS lemah. */
export const LOCATION_TIMEOUT_MS = 10000;

export type LocationState =
  /** pratinjau web: lokasi tidak dipakai */
  | { status: 'web' }
  | { status: 'checking' }
  /** izin belum pernah diminta: jelaskan dulu sebelum dialog sistem */
  | { status: 'ask' }
  | { status: 'loading' }
  | { status: 'ok'; coords: Coords; accuracy: number | null }
  | { status: 'denied'; canAskAgain: boolean }
  | { status: 'gps_off' }
  | { status: 'weak' };

function ok(pos: Location.LocationObject): LocationState {
  return {
    status: 'ok',
    coords: { latitude: pos.coords.latitude, longitude: pos.coords.longitude },
    accuracy: pos.coords.accuracy ?? null,
  };
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => resolve(null), ms);
    promise.then(
      v => {
        clearTimeout(id);
        resolve(v);
      },
      e => {
        clearTimeout(id);
        reject(e);
      },
    );
  });
}

/**
 * Baca lokasi sekali (izin sudah diberikan): GPS mati, akurasi seimbang dengan batas 10 detik,
 * lalu lokasi terakhir (maks. 2 menit) sebagai cadangan; tidak ada keduanya = sinyal lemah.
 */
export async function readLocation(): Promise<LocationState> {
  try {
    if (!(await Location.hasServicesEnabledAsync())) return { status: 'gps_off' };
    const pos = await withTimeout(
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      LOCATION_TIMEOUT_MS,
    );
    if (pos) return ok(pos);
  } catch {
    // Android melempar galat bila pengaturan lokasi HP tidak memenuhi (mis. GPS baru dimatikan)
    const enabled = await Location.hasServicesEnabledAsync().catch(() => true);
    if (!enabled) return { status: 'gps_off' };
  }
  const last = await Location.getLastKnownPositionAsync({ maxAge: 120000 }).catch(() => null);
  return last ? ok(last) : { status: 'weak' };
}

/**
 * Lokasi untuk absen (opsional di API). Gagal membaca lokasi tidak menghalangi absen; server
 * menandainya "Tanpa Lokasi". Kembali dari Pengaturan HP (aplikasi aktif lagi) = periksa ulang.
 */
export default function useLocation() {
  const [state, setState] = useState<LocationState>(
    isWeb ? { status: 'web' } : { status: 'checking' },
  );
  const alive = useRef(true);
  const stateRef = useRef(state);
  stateRef.current = state;

  const set = useCallback((s: LocationState) => {
    if (alive.current) setState(s);
  }, []);

  const read = useCallback(async () => {
    set({ status: 'loading' });
    set(await readLocation());
  }, [set]);

  const check = useCallback(async () => {
    if (isWeb) return;
    try {
      const perm = await Location.getForegroundPermissionsAsync();
      if (perm.granted) return read();
      set(
        perm.status === Location.PermissionStatus.UNDETERMINED
          ? { status: 'ask' }
          : { status: 'denied', canAskAgain: perm.canAskAgain },
      );
    } catch {
      set({ status: 'weak' });
    }
  }, [read, set]);

  /** Tombol "Izinkan lokasi": baru di sini dialog izin sistem muncul. */
  const request = useCallback(async () => {
    const perm = await Location.requestForegroundPermissionsAsync().catch(() => null);
    if (perm?.granted) return read();
    set({ status: 'denied', canAskAgain: perm?.canAskAgain ?? false });
  }, [read, set]);

  const openSettings = useCallback(() => {
    Linking.openSettings().catch(() => undefined);
  }, []);

  /** Android: dialog sistem "Nyalakan lokasi"; iOS: Pengaturan. */
  const enableGps = useCallback(async () => {
    if (!isAndroid) return openSettings();
    try {
      await Location.enableNetworkProviderAsync();
      await read();
    } catch {
      // pengguna menolak dialog: tetap GPS mati
    }
  }, [openSettings, read]);

  useEffect(() => {
    alive.current = true;
    check();
    const sub = AppState.addEventListener('change', next => {
      const s = stateRef.current.status;
      if (next === 'active' && (s === 'denied' || s === 'gps_off')) check();
    });
    return () => {
      alive.current = false;
      sub.remove();
    };
  }, [check]);

  return { state, request, retry: read, openSettings, enableGps };
}
