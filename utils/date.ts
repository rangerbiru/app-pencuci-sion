import dayjs, { Dayjs } from 'dayjs';
import utc from 'dayjs/plugin/utc';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import isoWeek from 'dayjs/plugin/isoWeek';
import 'dayjs/locale/id';

dayjs.extend(utc);
dayjs.extend(customParseFormat);
dayjs.extend(isoWeek);
dayjs.locale('id');

/**
 * Asia/Jakarta = UTC+7 tanpa DST, jadi cukup offset tetap. Ini menghindari ketergantungan
 * pada data zona waktu Intl yang tidak selalu lengkap di Hermes HP kelas bawah.
 */
const JAKARTA_OFFSET_MIN = 7 * 60;

export function jakarta(value?: string | number | Date | Dayjs | null): Dayjs {
  return (value === undefined || value === null ? dayjs() : dayjs(value)).utcOffset(
    JAKARTA_OFFSET_MIN,
  );
}

const EMPTY = '-';

function parse(value: string | null | undefined): Dayjs | null {
  if (!value) return null;
  // "YYYY-MM-DD" adalah tanggal kalender Jakarta, bukan tengah malam UTC
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const d = dayjs.utc(value, 'YYYY-MM-DD', true);
    return d.isValid() ? d.utcOffset(JAKARTA_OFFSET_MIN, true) : null;
  }
  const d = jakarta(value);
  return d.isValid() ? d : null;
}

/** 07/10/2026 */
export const formatDate = (v: string | null | undefined) => parse(v)?.format('DD/MM/YYYY') ?? EMPTY;
/** 07/10/2026 14:30 */
export const formatDateTime = (v: string | null | undefined) =>
  parse(v)?.format('DD/MM/YYYY HH:mm') ?? EMPTY;
/** 07 Okt 2026 */
export const formatDateShort = (v: string | null | undefined) =>
  parse(v)?.format('DD MMM YYYY') ?? EMPTY;
/** Oktober 2026 */
export const formatMonth = (v: string | null | undefined) => parse(v)?.format('MMMM YYYY') ?? EMPTY;
/** 14:30 */
export const formatTime = (v: string | null | undefined) => parse(v)?.format('HH:mm') ?? EMPTY;
/** Rabu, 7 Oktober 2026 */
export const formatDayLong = (v: string | null | undefined) =>
  parse(v)?.format('dddd, D MMMM YYYY') ?? EMPTY;
/** Rab, 7 Okt */
export const formatDayShort = (v: string | null | undefined) =>
  parse(v)?.format('ddd, D MMM') ?? EMPTY;
/** 07/10/2026 s.d. 10/10/2026 */
export const formatRange = (from: string | null | undefined, to: string | null | undefined) =>
  `${formatDate(from)} s.d. ${formatDate(to)}`;

/** Tanggal hari ini di Jakarta, "YYYY-MM-DD" */
export const todayJakarta = () => jakarta().format('YYYY-MM-DD');

/** Minggu ISO "2026-W38" (periode gaji Senin s.d. Minggu) */
export function isoWeekKey(d: Dayjs = jakarta()): string {
  return `${d.isoWeekYear()}-W${String(d.isoWeek()).padStart(2, '0')}`;
}

export function shiftWeek(week: string, delta: number): string {
  const m = /^(\d{4})-W(\d{2})$/.exec(week);
  if (!m) return isoWeekKey();
  const base = jakarta(dayjs.utc(`${m[1]}-01-04`))
    .isoWeek(parseInt(m[2], 10))
    .add(delta, 'week');
  return isoWeekKey(base);
}

/**
 * Sisa waktu sampai batas, mis. "5 jam 12 menit". null bila sudah lewat.
 */
export function remainingText(deadline: string | null | undefined, now: Dayjs = jakarta()) {
  const d = parse(deadline);
  if (!d) return null;
  const minutes = d.diff(now, 'minute');
  if (minutes <= 0) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} menit`;
  return m === 0 ? `${h} jam` : `${h} jam ${m} menit`;
}

export function greeting(now: Dayjs = jakarta()): string {
  const h = now.hour();
  if (h < 11) return 'Selamat pagi';
  if (h < 15) return 'Selamat siang';
  if (h < 18) return 'Selamat sore';
  return 'Selamat malam';
}
