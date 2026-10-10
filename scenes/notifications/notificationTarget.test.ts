import { AppNotification } from '@/types';
import { notificationHref } from './notificationTarget';

const n = (screen: string | null, id: number | null = 7): AppNotification => ({
  id: 1,
  type: { code: 'x', label: 'x' },
  title: 't',
  body: 'b',
  created_at: '2026-10-10T08:00:00+07:00',
  is_read: false,
  read_at: null,
  target: screen ? { screen, id } : null,
  data: {},
});

describe('notificationHref', () => {
  it('opens the detail screen from target.screen + target.id', () => {
    expect(notificationHref(n('approval'), 'mandor')).toEqual({
      pathname: '/verifikasi/[id]',
      params: { id: '7' },
    });
    expect(notificationHref(n('incoming_batch'), 'mandor')).toEqual({
      pathname: '/batch/terima/[id]',
      params: { id: '7' },
    });
  });

  it('opens list screens when id is null and picks the role-specific earnings screen', () => {
    expect(notificationHref(n('team_withdrawal', null), 'mandor')).toBe('/penarikan-tim');
    expect(notificationHref(n('earnings', 3), 'mandor')).toBe('/pendapatan-saya');
    expect(notificationHref(n('earnings', 3), 'pencuci')).toBe('/pendapatan');
  });

  it('has no destination for old web notifications or unknown screens', () => {
    expect(notificationHref(n(null), 'pencuci')).toBeNull();
    expect(notificationHref(n('unknown_screen'), 'pencuci')).toBeNull();
  });
});
