import type { IconName } from '@/components/elements/Icon';
import type { BadgeTone } from '@/theme';
import { AppNotification } from '@/types';
import { formatDate, jakarta } from '@/utils/date';

/** Ikon dan warna per jenis notifikasi (API_MOBILE bagian 11). Jenis tak dikenal: lonceng netral. */
const KIND: Record<string, { icon: IconName; tone: BadgeTone }> = {
  pengajuan_baru: { icon: 'inbox', tone: 'gold' },
  pengajuan_disetujui: { icon: 'check-circle', tone: 'accent' },
  pengajuan_ditolak: { icon: 'x-circle', tone: 'error' },
  timbang_menunggu: { icon: 'clock', tone: 'gold' },
  timbang_ditolak: { icon: 'alert-triangle', tone: 'error' },
  kerja_ulang_baru: { icon: 'repeat', tone: 'gold' },
  upah_dihitung: { icon: 'credit-card', tone: 'accent' },
  penarikan_diajukan: { icon: 'arrow-down-circle', tone: 'gold' },
  penarikan_disetujui: { icon: 'arrow-down-circle', tone: 'primary' },
  penarikan_dibayar: { icon: 'check-circle', tone: 'accent' },
  penarikan_ditolak: { icon: 'x-circle', tone: 'error' },
  bonus_capai: { icon: 'award', tone: 'accent' },
  batch_masuk: { icon: 'inbox', tone: 'primary' },
};

export function notificationKind(n: AppNotification): { icon: IconName; tone: BadgeTone } {
  return KIND[n.type.code] ?? { icon: 'bell', tone: 'neutral' };
}

/** Label kelompok tanggal: "Hari ini", "Kemarin", atau tanggal. */
export function dayGroup(iso: string, now = jakarta()): string {
  const d = jakarta(iso).format('YYYY-MM-DD');
  if (d === now.format('YYYY-MM-DD')) return 'Hari ini';
  if (d === now.subtract(1, 'day').format('YYYY-MM-DD')) return 'Kemarin';
  return formatDate(d);
}

/** Kelompokkan berurutan (daftar sudah terbaru di atas). */
export function groupByDay(items: AppNotification[], now = jakarta()) {
  const groups: { label: string; items: AppNotification[] }[] = [];
  for (const n of items) {
    const label = dayGroup(n.created_at, now);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(n);
    else groups.push({ label, items: [n] });
  }
  return groups;
}

export type NotificationListItem =
  | { type: 'day'; key: string; label: string }
  | { type: 'item'; key: string; n: AppNotification; first: boolean; last: boolean };

/** Ratakan kelompok untuk FlashList: judul hari lalu baris; first/last membentuk satu kartu. */
export function flattenGroups(groups: ReturnType<typeof groupByDay>): NotificationListItem[] {
  return groups.flatMap(g => [
    { type: 'day' as const, key: `day-${g.label}`, label: g.label },
    ...g.items.map((n, i) => ({
      type: 'item' as const,
      key: String(n.id),
      n,
      first: i === 0,
      last: i === g.items.length - 1,
    })),
  ]);
}
