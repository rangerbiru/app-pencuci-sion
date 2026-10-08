import { RoleCode } from '@/types';
import { Feature } from './config';

/**
 * Tab per peran (dari /me). Tab yang modulnya dimatikan di config ikut hilang.
 * Pencuci: Beranda, Pendapatan, Riwayat, Profil.
 * Kepala Pencuci: semua tab Pencuci + Tim.
 * Mandor: Beranda, Batch, Verifikasi, Kartu Kerja, Pendapatan, Profil.
 */
export type TabName =
  | 'beranda'
  | 'tim'
  | 'batch'
  | 'verifikasi'
  | 'kartu'
  | 'pendapatan'
  | 'riwayat'
  | 'profil';

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
  mandor: ['beranda', 'batch', 'verifikasi', 'kartu', 'pendapatan', 'profil'],
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
];

export function tabsForRole(role: RoleCode | undefined, enabled: readonly Feature[]): TabName[] {
  const tabs = ROLE_TABS[role ?? 'pencuci'] ?? ROLE_TABS.pencuci;
  return tabs.filter(t => {
    const f = TAB_FEATURE[t];
    return !f || enabled.includes(f);
  });
}

export function isSupervisor(role: RoleCode | undefined): boolean {
  return role === 'kepala_pencuci' || role === 'mandor';
}
