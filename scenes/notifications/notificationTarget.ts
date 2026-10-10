import type { Href } from 'expo-router';
import { AppNotification, RoleCode } from '@/types';

/**
 * Layar tujuan notifikasi (API_MOBILE bagian 11, `target.screen` + `target.id`).
 * null = notifikasi tanpa tujuan (jenis lama dari web, atau layar yang tidak dikenal).
 */
export function notificationHref(n: AppNotification, role: RoleCode | undefined): Href | null {
  const t = n.target;
  if (!t) return null;
  const id = t.id != null ? String(t.id) : null;
  switch (t.screen) {
    case 'approval':
      return id ? { pathname: '/verifikasi/[id]', params: { id } } : '/verifikasi';
    case 'work_today':
      return role === 'pencuci' ? '/riwayat' : '/beranda';
    case 'rework':
    case 'weighing':
      return '/beranda';
    case 'work_card':
      return id ? { pathname: '/kartu/[id]', params: { id } } : '/kartu';
    case 'earnings':
    case 'bonuses':
      return role === 'mandor' ? '/pendapatan-saya' : '/pendapatan';
    case 'withdrawal':
      return '/tarik-dana';
    case 'team_withdrawal':
      return id ? { pathname: '/penarikan-tim/[id]', params: { id } } : '/penarikan-tim';
    case 'incoming_batch':
      return id ? { pathname: '/batch/terima/[id]', params: { id } } : '/batch';
    default:
      return null;
  }
}
