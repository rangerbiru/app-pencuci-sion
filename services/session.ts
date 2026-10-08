import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import { appActions } from '@/slices/app.slice';
import type { Dispatch } from '@/utils/store';
import config from '@/utils/config';
import { isBelowMinVersion } from '@/utils/version';
import { Me } from '@/types';
import { api } from './api/api';
import { ApiError } from './api/errors';
import { fetchMe, fetchMeta, login, logout } from './auth.service';
import { clearToken, loadToken, saveToken } from './auth/tokenStorage';
import { discardOwnedBy } from './queue';

/**
 * Sesi pengguna. Token di SecureStore; profil (tidak rahasia) di AsyncStorage supaya
 * aplikasi tetap bisa dibuka tanpa sinyal.
 */
const PROFILE_KEY = 'sion.profile.v1';

async function cacheProfile(me: Me) {
  try {
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(me));
  } catch {
    // cache gagal tidak menghalangi login
  }
}

async function cachedProfile(): Promise<Me | null> {
  try {
    const raw = await AsyncStorage.getItem(PROFILE_KEY);
    return raw ? (JSON.parse(raw) as Me) : null;
  } catch {
    return null;
  }
}

export async function checkMeta(dispatch: Dispatch) {
  const res = await fetchMeta();
  if (!res.ok) return;
  const meta = res.data.data;
  const serverMs = Date.parse(meta.server_time);
  dispatch(
    appActions.setMeta({
      updateRequired: isBelowMinVersion(config.appVersion, meta.min_app_version),
      minAppVersion: meta.min_app_version,
      serverOffsetMs: Number.isNaN(serverMs) ? 0 : serverMs - Date.now(),
      company: meta.company,
      settings: meta.settings,
    }),
  );
}

export async function bootstrapSession(dispatch: Dispatch) {
  const token = await loadToken();
  if (!token) {
    dispatch(appActions.signedOut());
    return;
  }
  const res = await fetchMe();
  if (res.ok) {
    await cacheProfile(res.data.data);
    dispatch(appActions.signedIn(res.data.data));
    return;
  }
  if (res.error.status === 401) {
    await clearToken();
    dispatch(appActions.signedOut('Sesi Anda berakhir. Silakan masuk lagi.'));
    return;
  }
  // tanpa sinyal: pakai profil terakhir supaya pengguna tetap bisa absen (masuk antrean)
  const cached = await cachedProfile();
  if (cached) dispatch(appActions.signedIn(cached));
  else dispatch(appActions.signedOut());
}

export function deviceName(): string {
  const parts = [Device.manufacturer, Device.modelName].filter(Boolean);
  return parts.length ? parts.join(' ') : 'HP Android';
}

export async function signIn(
  dispatch: Dispatch,
  identifier: string,
  password: string,
): Promise<{ ok: true } | { ok: false; error: ApiError }> {
  const res = await login(identifier.trim(), password, deviceName());
  if (!res.ok) return res;
  await saveToken(res.data.data.token);
  await cacheProfile(res.data.data.user);
  dispatch(api.util.resetApiState());
  dispatch(appActions.signedIn(res.data.data.user));
  return { ok: true };
}

/**
 * Keluar. `forced` = token ditolak server (401): antrean milik pengguna disimpan supaya
 * terkirim setelah ia masuk lagi. Keluar sengaja menghapus antreannya (layar sudah memperingatkan).
 */
export async function signOut(
  dispatch: Dispatch,
  opts: { forced?: boolean; userId?: number | null } = {},
) {
  if (!opts.forced) {
    await logout();
    await discardOwnedBy(opts.userId ?? null);
  }
  await clearToken();
  await AsyncStorage.removeItem(PROFILE_KEY).catch(() => undefined);
  dispatch(api.util.resetApiState());
  dispatch(
    appActions.signedOut(opts.forced ? 'Sesi Anda berakhir. Silakan masuk lagi.' : undefined),
  );
}
