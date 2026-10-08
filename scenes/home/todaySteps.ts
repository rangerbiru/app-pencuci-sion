import { Attendance, Rework, Submission, SubmissionType, WorkDay } from '@/types';
import type { QueueItem, QueueKind } from '@/services/queue/types';
import { formatTime } from '@/utils/date';
import { addDecimal, toCents } from '@/utils/decimal';
import { formatGram, formatPcs } from '@/utils/format';

/**
 * Urutan nyata hari kerja pencuci: Absen masuk -> Ambil bahan -> Serah hasil lembab -> Absen pulang.
 * Fungsi murni supaya mudah diuji; layar hanya menggambar hasilnya.
 */

export type StepKey = 'check_in' | 'take' | 'hand_over' | 'check_out';
export type StepState = 'done' | 'waiting' | 'queued' | 'rejected' | 'active' | 'todo';

export interface TodayStep {
  key: StepKey;
  title: string;
  state: StepState;
  /** keterangan singkat: jam, gram, alasan tolak */
  detail: string | null;
}

export type NextAction =
  | { kind: 'check_in' | 'take' | 'hand_over' | 'check_out'; label: string }
  | { kind: 'refresh'; label: string; reason: string }
  | { kind: 'done'; label: string };

export interface ReworkOffer {
  kind: 'take_rework' | 'hand_over_rework';
  label: string;
  rework: Rework;
}

export interface TodayInput {
  attendance: Attendance | null | undefined;
  work: WorkDay | null | undefined;
  queue: QueueItem[];
  rework: Rework[];
}

export interface TodayModel {
  steps: TodayStep[];
  next: NextAction;
  reworkOffers: ReworkOffer[];
  /** boleh ambil bahan lagi setelah pengambilan pertama */
  canTakeMore: boolean;
  /**
   * Absen pulang di luar urutan (mis. hari ini hanya kerja ulang, atau tidak ada bahan).
   * Tampil sebagai aksi kedua bila absen pulang belum menjadi langkah utama.
   */
  canCheckOutEarly: boolean;
}

const has = (q: QueueItem[], kind: QueueKind) =>
  q.some(i => i.kind === kind && i.status !== 'failed');

function byType(subs: Submission[], type: SubmissionType) {
  return subs.filter(s => s.type.code === type);
}

function sumGram(subs: Submission[]) {
  return addDecimal(...subs.map(s => s.gram));
}

function sumPcs(subs: Submission[]) {
  return subs.reduce((n, s) => n + (s.pcs ?? 0), 0);
}

export function buildToday({ attendance, work, queue, rework }: TodayInput): TodayModel {
  const subs = work?.submissions ?? [];
  const checkedIn = !!attendance?.check_in.at;
  const checkedOut = !!attendance?.check_out.at;
  const queuedIn = has(queue, 'check_in');
  const queuedOut = has(queue, 'check_out');

  const takes = byType(subs, 'ambil_bahan');
  const takesApproved = takes.filter(s => s.status.code === 'disetujui');
  const takesWaiting = takes.filter(s => s.status.code === 'menunggu');
  const takesRejected = takes.filter(s => s.status.code === 'ditolak');
  const queuedTake = has(queue, 'take_material');

  const hands = byType(subs, 'serah_lembab');
  const handsApproved = hands.filter(s => s.status.code === 'disetujui');
  const handsWaiting = hands.filter(s => s.status.code === 'menunggu');
  const handsRejected = hands.filter(s => s.status.code === 'ditolak');
  const queuedHand = has(queue, 'hand_over_damp');

  const checkInStep: TodayStep = {
    key: 'check_in',
    title: 'Absen masuk',
    state: checkedIn ? 'done' : queuedIn ? 'queued' : 'todo',
    detail: checkedIn
      ? `Jam ${formatTime(attendance?.check_in.at)}${attendance?.check_in.location_flag?.code === 'luar_lokasi' ? ', di luar lokasi' : ''}`
      : queuedIn
        ? 'Belum terkirim'
        : null,
  };

  let takeState: StepState = 'todo';
  let takeDetail: string | null = null;
  if (takesApproved.length) {
    takeState = 'done';
    takeDetail = `${formatGram(sumGram(takesApproved))} disetujui`;
    if (takesWaiting.length) takeDetail += `, ${takesWaiting.length} menunggu`;
  } else if (takesWaiting.length) {
    takeState = 'waiting';
    takeDetail = `${formatGram(sumGram(takesWaiting))} menunggu disetujui`;
  } else if (queuedTake) {
    takeState = 'queued';
    takeDetail = 'Belum terkirim';
  } else if (takesRejected.length) {
    takeState = 'rejected';
    const last = takesRejected[takesRejected.length - 1];
    takeDetail = `Ditolak: ${last.reject_reason ?? 'tanpa alasan'}. Ambil bahan lagi.`;
  }

  let handState: StepState = 'todo';
  let handDetail: string | null = null;
  if (handsApproved.length) {
    handState = 'done';
    handDetail = `${formatPcs(sumPcs(handsApproved))} pcs disetujui`;
  } else if (handsWaiting.length) {
    handState = 'waiting';
    handDetail = `${formatPcs(sumPcs(handsWaiting))} pcs menunggu disetujui`;
  } else if (queuedHand) {
    handState = 'queued';
    handDetail = 'Belum terkirim';
  } else if (handsRejected.length) {
    handState = 'rejected';
    const last = handsRejected[handsRejected.length - 1];
    handDetail = `Ditolak: ${last.reject_reason ?? 'tanpa alasan'}. Serahkan lagi.`;
  }

  const checkOutStep: TodayStep = {
    key: 'check_out',
    title: 'Absen pulang',
    state: checkedOut ? 'done' : queuedOut ? 'queued' : 'todo',
    detail: checkedOut
      ? `Jam ${formatTime(attendance?.check_out.at)}`
      : queuedOut
        ? 'Belum terkirim'
        : null,
  };

  const steps: TodayStep[] = [
    checkInStep,
    { key: 'take', title: 'Ambil bahan', state: takeState, detail: takeDetail },
    { key: 'hand_over', title: 'Serah hasil lembab', state: handState, detail: handDetail },
    checkOutStep,
  ];

  const inDone = checkedIn || queuedIn;
  const takeSubmitted = takeState === 'done' || takeState === 'waiting' || takeState === 'queued';
  const handSubmitted = handState === 'done' || handState === 'waiting' || handState === 'queued';
  const outDone = checkedOut || queuedOut;

  let next: NextAction;
  if (!inDone) next = { kind: 'check_in', label: 'Absen masuk' };
  else if (outDone) next = { kind: 'done', label: 'Kerja hari ini selesai' };
  else if (!takeSubmitted) next = { kind: 'take', label: 'Ambil bahan' };
  else if (takeState !== 'done' && !handSubmitted)
    next = {
      kind: 'refresh',
      label: 'Periksa status',
      reason:
        'Serah hasil bisa dikirim setelah pengambilan bahan disetujui Kepala Pencuci atau Mandor.',
    };
  else if (!handSubmitted) next = { kind: 'hand_over', label: 'Serah hasil lembab' };
  else next = { kind: 'check_out', label: 'Absen pulang' };

  const active = next.kind === 'done' || next.kind === 'refresh' ? null : next.kind;
  for (const s of steps) {
    if (s.key === active && (s.state === 'todo' || s.state === 'rejected')) {
      s.state = s.state === 'rejected' ? 'rejected' : 'active';
    }
  }

  const reworkOffers: ReworkOffer[] = [];
  if (inDone && !outDone) {
    for (const r of rework) {
      const queuedFor = (kind: QueueKind) =>
        queue.some(i => i.kind === kind && i.dedupeKey === `${kind}:${r.id}`);
      if (r.status.code === 'menunggu_diambil' && !queuedFor('take_rework')) {
        reworkOffers.push({ kind: 'take_rework', label: 'Ambil kerja ulang', rework: r });
      }
      if (r.status.code === 'diambil' && !queuedFor('hand_over_rework')) {
        reworkOffers.push({ kind: 'hand_over_rework', label: 'Serah kerja ulang', rework: r });
      }
    }
  }

  return {
    steps,
    next,
    reworkOffers,
    canTakeMore: inDone && !outDone && takeSubmitted,
    canCheckOutEarly: inDone && !outDone && next.kind !== 'check_out',
  };
}

/** Sisa gram jatah yang masih bisa diambil (string API, tanpa float). */
export function isWithinRemaining(weight: string, remaining: string): boolean {
  const w = toCents(weight);
  const r = toCents(remaining);
  if (w === null || r === null) return false;
  return w > 0n && w <= r;
}
