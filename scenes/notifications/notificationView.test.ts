import { AppNotification } from '@/types';
import { jakarta } from '@/utils/date';
import { dayGroup, groupByDay, notificationKind } from './notificationView';

const now = jakarta('2026-10-10T12:00:00+07:00');
const n = (id: number, created_at: string, code = 'pengajuan_baru'): AppNotification => ({
  id,
  type: { code, label: code },
  title: 't',
  body: 'b',
  created_at,
  is_read: false,
  read_at: null,
  target: null,
  data: {},
});

describe('notification view', () => {
  it('labels today, yesterday, and older dates', () => {
    expect(dayGroup('2026-10-10T07:00:00+07:00', now)).toBe('Hari ini');
    expect(dayGroup('2026-10-09T23:59:00+07:00', now)).toBe('Kemarin');
    expect(dayGroup('2026-10-07T08:00:00+07:00', now)).toBe('07/10/2026');
  });

  it('groups consecutive items by day, newest first', () => {
    const g = groupByDay(
      [
        n(3, '2026-10-10T09:00:00+07:00'),
        n(2, '2026-10-10T08:00:00+07:00'),
        n(1, '2026-10-08T08:00:00+07:00'),
      ],
      now,
    );
    expect(g.map(x => [x.label, x.items.length])).toEqual([
      ['Hari ini', 2],
      ['08/10/2026', 1],
    ]);
  });

  it('falls back to a neutral bell for unknown types', () => {
    expect(notificationKind(n(1, '2026-10-10T09:00:00+07:00', 'pengajuan_ditolak')).tone).toBe(
      'error',
    );
    expect(notificationKind(n(1, '2026-10-10T09:00:00+07:00', 'batch_assigned'))).toEqual({
      icon: 'bell',
      tone: 'neutral',
    });
  });
});
