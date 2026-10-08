import { RoleCode } from '@/types';
import { Feature } from './config';

/**
 * Tab per peran (dari /me). Tab yang modulnya dimatikan di config ikut hilang.
 * Pencuci: Beranda, Pendapatan, Riwayat, Profil.
 * Kepala Pencuci: semua tab Pencuci + Tim.
 * Mandor: Beranda, Batch, Verifikasi, Kartu Kerja, Akun (Pendapatan dan Profil di dalam Akun).
 * Maksimal 5 tab; tidak ada drawer.
 */
export type TabName =
  | 'beranda'
  | 'tim'
  | 'batch'
  | 'verifikasi'
  | 'kartu'
  | 'pendapatan'
  | 'riwayat'
  | 'profil'
  | 'akun';

const TAB_FEATURE: Partial<Record<TabName, Feature>> = {
  tim: 'team',
  batch: 'batches',
  verifikasi: 'approvals',
  kartu: 'workCards',
  pendapatan: 'earnings',
  riwayat: 'history',
};

const ROLE_TABS: Record<RoleCode, TabName[]> = {
  pencuci: ['beranda', 'pendapatan', 'riwayat', 'profil'],
  kepala_pencuci: ['beranda', 'tim', 'pendapatan', 'riwayat', 'profil'],
  mandor: ['beranda', 'batch', 'verifikasi', 'kartu', 'akun'],
};

export const ALL_TABS: TabName[] = [
  'beranda',
  'tim',
  'batch',
  'verifikasi',
  'kartu',
  'pendapatan',
  'riwayat',
  'profil',
  'akun',
];

export const MAX_TABS = 5;

export function tabsForRole(role: RoleCode | undefined, enabled: readonly Feature[]): TabName[] {
  const tabs = ROLE_TABS[role ?? 'pencuci'] ?? ROLE_TABS.pencuci;
  return tabs
    .filter(t => {
      const f = TAB_FEATURE[t];
      return !f || enabled.includes(f);
    })
    .slice(0, MAX_TABS);
}

/**
 * Lebar label tab dalam satuan em (Google Sans Flex SemiBold, diukur di browser).
 * Dipakai untuk memilih ukuran huruf yang muat tanpa terpotong.
 */
const LABEL_EM: Record<string, number> = {
  Beranda: 4.0,
  Tim: 1.76,
  Batch: 2.75,
  Verifikasi: 4.41,
  'Kartu Kerja': 5.35,
  Kartu: 2.66,
  Kerja: 2.46,
  Pendapatan: 5.76,
  Riwayat: 3.72,
  Profil: 2.51,
  Akun: 2.46,
};

/** em untuk teks yang tidak ada di tabel: rata-rata 0,6 em per huruf. */
function textEm(text: string): number {
  return LABEL_EM[text] ?? text.length * 0.6;
}

export const TAB_LABEL_BASE = 12;
const SAFETY = 1.04;

export interface TabLabelLayout {
  fontSize: number;
  lines: 1 | 2;
}

/**
 * Ukuran label tab yang seragam untuk semua tab dan tidak pernah terpotong.
 * Ukuran dasar 12 ikut pengaturan besar huruf HP. Label dua kata boleh turun ke baris kedua;
 * kalau satu kata pun tidak muat, ukuran diperkecil sampai muat.
 */
export function tabLabelLayout(
  labels: string[],
  screenWidth: number,
  fontScale: number,
  tabPadding = 2,
): TabLabelLayout {
  const desired = TAB_LABEL_BASE * Math.max(1, fontScale);
  if (!labels.length) return { fontSize: desired, lines: 1 };
  const avail = screenWidth / labels.length - tabPadding;
  const fitOneLine = Math.min(...labels.map(l => avail / (textEm(l) * SAFETY)));
  if (fitOneLine >= desired) return { fontSize: desired, lines: 1 };
  const fitTwoLines = Math.min(
    ...labels.map(l => avail / (Math.max(...l.split(' ').map(textEm)) * SAFETY)),
  );
  // dua baris hanya bila memberi huruf yang lebih besar daripada satu baris
  if (fitTwoLines > fitOneLine && labels.some(l => l.includes(' '))) {
    return { fontSize: Math.floor(Math.min(desired, fitTwoLines) * 10) / 10, lines: 2 };
  }
  return { fontSize: Math.floor(fitOneLine * 10) / 10, lines: 1 };
}

export function isSupervisor(role: RoleCode | undefined): boolean {
  return role === 'kepala_pencuci' || role === 'mandor';
}
