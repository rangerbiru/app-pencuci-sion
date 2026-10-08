import Constants from 'expo-constants';
import { Env } from '@/types/env';

/**
 * Daftar modul fitur. Matikan satu modul dengan menghapusnya dari `enabledFeatures`;
 * tab, kartu Beranda, dan tombol yang terkait ikut hilang (lihat isFeatureEnabled).
 */
export const allFeatures = [
  'attendance', // absen masuk/pulang
  'work', // ambil bahan, serah hasil lembab
  'rework', // kerja ulang
  'weighing', // konfirmasi hasil timbang
  'history', // riwayat harian
  'earnings', // pendapatan, bonus, saldo
  'dailyProfit', // profit harian (pencuci, tim)
  'withdrawals', // tarik dana
  'team', // tim (Kepala Pencuci, Mandor)
  'approvals', // verifikasi pengajuan
  'workCards', // kartu kerja dan QC
  'batches', // batch masuk dan terima batch
  'rations', // penjatahan
  'preparation', // penyiapan batch Cuci Langsung
  'teamWithdrawals', // penarikan pencuci Borongan (Mandor)
  'containers', // scan QR wadah
] as const;

export type Feature = (typeof allFeatures)[number];

/** Semua modul aktif sejak Tahap 15C (GET /items membuka Penyiapan dan tambah baris kartu). */
const enabledFeatures: readonly Feature[] = allFeatures;

/**
 * Saklar perilaku yang menunggu keputusan klien.
 * kepalaWashing: Kepala Pencuci ikut ambil bahan, serah hasil, dan kerja ulang. Mati sampai
 * klien memutuskan siapa yang menyetujui pengajuan Kepala dan bagaimana upahnya
 * (API_MOBILE.md bagian 10, "Kepala Pencuci yang ikut mencuci").
 */
export const flags = {
  kepalaWashing: false,
} as const;

/** API_URL boleh dengan atau tanpa akhiran /api/v1. */
export function apiBaseFrom(raw: string | undefined): string {
  const url = (raw ?? '').trim().replace(/\/+$/, '');
  return /\/api\/v1$/.test(url) ? url : `${url}/api/v1`;
}

const apiBase = apiBaseFrom(Constants.expoConfig?.extra?.apiUrl as string | undefined);

const config = {
  env: (Constants.expoConfig?.extra?.env as Env | undefined) ?? Env.dev,
  /** Semua endpoint ada di bawah /api/v1 */
  apiBase,
  appVersion: Constants.expoConfig?.version ?? '1.0.0',
  features: enabledFeatures,
  flags,
  timezone: 'Asia/Jakarta',
  requestTimeoutMs: 30000,
  photo: { maxSide: 1280, quality: 0.7 },
} as const;

export function isFeatureEnabled(feature: Feature): boolean {
  return config.features.includes(feature);
}

export default config;
