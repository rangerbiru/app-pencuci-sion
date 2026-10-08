import { buildToday, isWithinRemaining } from './todaySteps';
import { Attendance, Submission, WorkDay, Rework } from '@/types';
import type { QueueItem } from '@/services/queue/types';

const mark = (at: string | null) => ({
  at,
  photo_url: null,
  photo_taken_at: null,
  distance_m: null,
  location_flag: null,
});
const attendance = (inAt: string | null, outAt: string | null = null): Attendance => ({
  id: 1,
  date: '2026-09-24',
  status: { code: 'hadir', label: 'Hadir' },
  source: { code: 'mobile_app', label: 'Mobile' },
  location: null,
  check_in: mark(inAt),
  check_out: mark(outAt),
});
const sub = (
  type: Submission['type']['code'],
  status: Submission['status']['code'],
  extra: Partial<Submission> = {},
): Submission => ({
  id: Math.random(),
  type: { code: type, label: type },
  status: { code: status, label: status },
  work_date: '2026-09-24',
  worker: { id: 7, name: 'Siti' },
  batch_assignment_id: 12,
  batch_code: 'B-MOB',
  item: 'Bulu Berat',
  gram: '500.00',
  pcs: 10,
  photo_url: null,
  photo_taken_at: null,
  submitted_at: '2026-09-24T08:00:00+07:00',
  decided_by: null,
  decided_at: null,
  reject_reason: null,
  daily_work_card_id: null,
  ...extra,
});
const day = (submissions: Submission[]): WorkDay => ({
  date: '2026-09-24',
  card: null,
  submissions,
  pending_count: 0,
});
const queued = (kind: QueueItem['kind'], dedupeKey?: string): QueueItem => ({
  id: kind,
  kind,
  label: kind,
  path: '/',
  dedupeKey,
  fields: {},
  files: {},
  json: false,
  owner: 7,
  createdAt: '',
  attempts: 0,
  status: 'pending',
});

describe('kartu Hari ini', () => {
  it('starts with Absen masuk', () => {
    const m = buildToday({ attendance: null, work: day([]), queue: [], rework: [] });
    expect(m.next).toEqual({ kind: 'check_in', label: 'Absen masuk' });
    expect(m.steps.map(s => s.state)).toEqual(['active', 'todo', 'todo', 'todo']);
  });

  it('moves to Ambil bahan after check-in, even if check-in is still queued', () => {
    const m = buildToday({
      attendance: null,
      work: day([]),
      queue: [queued('check_in')],
      rework: [],
    });
    expect(m.steps[0]).toMatchObject({ state: 'queued', detail: 'Belum terkirim' });
    expect(m.next.kind).toBe('take');
    expect(m.steps[1].state).toBe('active');
  });

  it('waits for approval before hand-over and offers a working refresh button', () => {
    const m = buildToday({
      attendance: attendance('2026-09-24T07:58:00+07:00'),
      work: day([sub('ambil_bahan', 'menunggu')]),
      queue: [],
      rework: [],
    });
    expect(m.steps[1].state).toBe('waiting');
    expect(m.next.kind).toBe('refresh');
  });

  it('offers Serah hasil lembab after approval, then Absen pulang', () => {
    const a = attendance('2026-09-24T07:58:00+07:00');
    const m1 = buildToday({
      attendance: a,
      work: day([sub('ambil_bahan', 'disetujui')]),
      queue: [],
      rework: [],
    });
    expect(m1.next.kind).toBe('hand_over');
    expect(m1.steps[1].detail).toBe('500\u00a0gr disetujui');
    const m2 = buildToday({
      attendance: a,
      work: day([
        sub('ambil_bahan', 'disetujui'),
        sub('serah_lembab', 'menunggu', { gram: null, pcs: 240 }),
      ]),
      queue: [],
      rework: [],
    });
    expect(m2.next.kind).toBe('check_out');
  });

  it('shows the rejection reason and asks again', () => {
    const m = buildToday({
      attendance: attendance('2026-09-24T07:58:00+07:00'),
      work: day([sub('ambil_bahan', 'ditolak', { reject_reason: 'Foto buram' })]),
      queue: [],
      rework: [],
    });
    expect(m.steps[1].state).toBe('rejected');
    expect(m.steps[1].detail).toMatch(/Foto buram/);
    expect(m.next.kind).toBe('take');
  });

  it('offers rework take and hand-over', () => {
    const r = (status: Rework['status']['code'], id: number): Rework => ({
      id,
      daily_work_card_id: 88,
      card_date: '2026-09-23',
      rework_date: '2026-09-24',
      pcs: 20,
      gram: null,
      status: { code: status, label: status },
      taken_pcs: null,
      taken_at: null,
      returned_pcs: null,
      returned_at: null,
    });
    const m = buildToday({
      attendance: attendance('2026-09-24T07:58:00+07:00'),
      work: day([]),
      queue: [queued('take_rework', 'take_rework:1')],
      rework: [r('menunggu_diambil', 1), r('diambil', 2)],
    });
    expect(m.reworkOffers.map(o => [o.kind, o.rework.id])).toEqual([['hand_over_rework', 2]]);
  });

  it('is done after check-out', () => {
    const m = buildToday({
      attendance: attendance('2026-09-24T07:58:00+07:00', '2026-09-24T16:00:00+07:00'),
      work: day([]),
      queue: [],
      rework: [],
    });
    expect(m.next.kind).toBe('done');
  });
});

describe('isWithinRemaining', () => {
  it('rejects weights above the remaining ration', () => {
    expect(isWithinRemaining('10000.00', '10000.00')).toBe(true);
    expect(isWithinRemaining('10000.01', '10000.00')).toBe(false);
    expect(isWithinRemaining('0.00', '10000.00')).toBe(false);
  });

  it('offers early check-out after check-in, not before or after', () => {
    const before = buildToday({ attendance: null, work: null, queue: [], rework: [] });
    expect(before.canCheckOutEarly).toBe(false);
    const inOnly = buildToday({
      attendance: attendance('2026-09-24T07:58:00+07:00'),
      work: day([]),
      queue: [],
      rework: [],
    });
    expect(inOnly.next.kind).toBe('take');
    expect(inOnly.canCheckOutEarly).toBe(true);
    const out = buildToday({
      attendance: attendance('2026-09-24T07:58:00+07:00', '2026-09-24T16:00:00+07:00'),
      work: day([]),
      queue: [],
      rework: [],
    });
    expect(out.canCheckOutEarly).toBe(false);
  });
});
