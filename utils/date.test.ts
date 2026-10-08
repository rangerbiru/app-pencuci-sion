import dayjs from 'dayjs';
import {
  formatDate,
  formatDateShort,
  formatDateTime,
  formatMonth,
  formatRange,
  isoWeekKey,
  jakarta,
  remainingText,
  shiftWeek,
} from './date';
import { compareVersions, isBelowMinVersion } from './version';

describe('date formatting in Asia/Jakarta', () => {
  it('formats ISO timestamps in Jakarta time regardless of device zone', () => {
    expect(formatDateTime('2026-10-07T07:30:00Z')).toBe('07/10/2026 14:30');
    expect(formatDateTime('2026-10-07T14:30:00+07:00')).toBe('07/10/2026 14:30');
  });

  it('treats YYYY-MM-DD as a calendar date', () => {
    expect(formatDate('2026-10-07')).toBe('07/10/2026');
    expect(formatDateShort('2026-10-07')).toBe('07 Okt 2026');
    expect(formatMonth('2026-10-07')).toBe('Oktober 2026');
    expect(formatRange('2026-10-07', '2026-10-10')).toBe('07/10/2026 s.d. 10/10/2026');
  });

  it('shows a dash for empty dates', () => {
    expect(formatDate(null)).toBe('-');
  });

  it('builds ISO week keys Monday to Sunday', () => {
    expect(isoWeekKey(jakarta('2026-09-14T08:00:00+07:00'))).toBe('2026-W38');
    expect(isoWeekKey(jakarta('2026-09-20T23:00:00+07:00'))).toBe('2026-W38');
    expect(shiftWeek('2026-W38', -1)).toBe('2026-W37');
    expect(shiftWeek('2026-W01', -1)).toBe('2025-W52');
  });

  it('describes remaining time before a deadline', () => {
    const now = dayjs('2026-09-24T10:00:00+07:00');
    expect(remainingText('2026-09-25T10:00:00+07:00', now)).toBe('24 jam');
    expect(remainingText('2026-09-24T15:12:00+07:00', now)).toBe('5 jam 12 menit');
    expect(remainingText('2026-09-24T09:00:00+07:00', now)).toBeNull();
  });
});

describe('version check', () => {
  it('compares semantic versions', () => {
    expect(compareVersions('1.0.0', '1.0.1')).toBeLessThan(0);
    expect(compareVersions('1.10.0', '1.9.9')).toBeGreaterThan(0);
    expect(isBelowMinVersion('1.0.0', '1.0.0')).toBe(false);
    expect(isBelowMinVersion('1.0.0', '1.2.0')).toBe(true);
  });
});
