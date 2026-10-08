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

/**
 * 'preparation' dimatikan: POST /batches/{id}/preparation butuh item_id hasil utama dan
 * sampingan, tetapi API belum punya daftar item dan objek batch tidak membawa item_id.
 */
const enabledFeatures: readonly Feature[] = allFeatures.filter(f => f !== 'preparation');

const apiUrl = ((Constants.expoConfig?.extra?.apiUrl as string | undefined) ?? '').replace(
  /\/+$/,
  '',
);

const config = {
  env: (Constants.expoConfig?.extra?.env as Env | undefined) ?? Env.dev,
  apiUrl,
  /** Semua endpoint ada di bawah /api/v1 */
  apiBase: `${apiUrl}/api/v1`,
  appVersion: Constants.expoConfig?.version ?? '1.0.0',
  features: enabledFeatures,
  timezone: 'Asia/Jakarta',
  requestTimeoutMs: 30000,
  photo: { maxSide: 1280, quality: 0.7 },
} as const;

export function isFeatureEnabled(feature: Feature): boolean {
  return config.features.includes(feature);
}

export default config;
