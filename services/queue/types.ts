import { FieldValue } from '../api/multipart';
import { ApiError } from '../api/errors';
import { tagTypes } from '../api/api';

export type QueueKind =
  | 'check_in'
  | 'check_out'
  | 'take_material'
  | 'hand_over_damp'
  | 'take_rework'
  | 'hand_over_rework'
  | 'weighing'
  | 'receive_batch';

export type QueueStatus = 'pending' | 'sending' | 'failed';

export interface QueueItem {
  /** juga dipakai sebagai Idempotency-Key */
  id: string;
  kind: QueueKind;
  /** teks untuk pengguna, mis. "Ambil bahan 1.250 gr" */
  label: string;
  path: string;
  /** kunci untuk mencegah dua aksi sama yang tertunda (mis. absen masuk dua kali) */
  dedupeKey?: string;
  fields: Record<string, FieldValue>;
  /** berkas yang sudah disalin ke folder antrean */
  files: Record<string, string>;
  json: boolean;
  /** id pengguna pemilik aksi; hanya dikirim saat pengguna itu yang masuk */
  owner: number | null;
  createdAt: string;
  attempts: number;
  status: QueueStatus;
  lastError?: string;
}

export type QueueOutcome<T = unknown> =
  | { status: 'sent'; data: T }
  | { status: 'queued'; item: QueueItem }
  | { status: 'rejected'; error: ApiError };

export const QUEUE_LABELS: Record<QueueKind, string> = {
  check_in: 'Absen masuk',
  check_out: 'Absen pulang',
  take_material: 'Ambil bahan',
  hand_over_damp: 'Serah hasil lembab',
  take_rework: 'Ambil kerja ulang',
  hand_over_rework: 'Serah kerja ulang',
  weighing: 'Konfirmasi hasil timbang',
  receive_batch: 'Terima batch',
};

type Tag = (typeof tagTypes)[number];

/** Data yang perlu dimuat ulang setelah aksi berhasil terkirim. */
export const QUEUE_INVALIDATES: Record<QueueKind, Tag[]> = {
  check_in: ['Attendance', 'Team'],
  check_out: ['Attendance', 'Team'],
  take_material: ['WorkToday', 'Rations', 'WorkHistory'],
  hand_over_damp: ['WorkToday', 'WorkHistory'],
  take_rework: ['Rework', 'WorkToday'],
  hand_over_rework: ['Rework', 'WorkToday'],
  weighing: ['Weighings', 'WorkHistory', 'Earnings', 'Balance'],
  receive_batch: ['Batches', 'RationBatches'],
};

/** 409 untuk absen berarti sudah tercatat (mis. kiriman sebelumnya sampai tetapi jawabannya hilang). */
export const CONFLICT_MEANS_DONE: QueueKind[] = ['check_in', 'check_out'];
