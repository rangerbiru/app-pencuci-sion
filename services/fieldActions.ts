import { enqueue } from './queue';
import { Attendance, Submission, WorkCard, Batch, PreparationResult } from '@/types';
import type { PreparationPayload } from './batches.service';
import { Photo } from '@/utils/photo';
import { formatGram, formatPcs } from '@/utils/format';
import { todayJakarta } from '@/utils/date';

/**
 * Aksi lapangan yang lewat antrean kirim ulang. Foto harus sudah dikompres (compressPhoto).
 */

export interface Coords {
  latitude: number;
  longitude: number;
}

export function submitAttendance(mode: 'in' | 'out', photo: Photo, coords: Coords | null) {
  return enqueue<{ data: Attendance }>({
    kind: mode === 'in' ? 'check_in' : 'check_out',
    path: mode === 'in' ? '/attendance/check-in' : '/attendance/check-out',
    dedupeKey: `${mode === 'in' ? 'check_in' : 'check_out'}:${todayJakarta()}`,
    fields: {
      photo_taken_at: photo.takenAt,
      latitude: coords?.latitude,
      longitude: coords?.longitude,
    },
    files: { photo: photo.uri },
  });
}

export function submitTakeMaterial(input: {
  batchAssignmentId: number;
  batchCode: string;
  weight: string;
  pcs: number | null;
  photo: Photo;
}) {
  return enqueue<{ data: Submission }>({
    kind: 'take_material',
    path: '/work/take-material',
    label: `Ambil bahan ${input.batchCode} ${formatGram(input.weight)}`,
    fields: {
      batch_assignment_id: input.batchAssignmentId,
      weight: input.weight,
      pcs: input.pcs,
      photo_taken_at: input.photo.takenAt,
    },
    files: { photo: input.photo.uri },
  });
}

export function submitHandOverDamp(input: { pcs: number; photo: Photo }) {
  return enqueue<{ data: Submission }>({
    kind: 'hand_over_damp',
    path: '/work/hand-over-damp',
    label: `Serah hasil lembab ${formatPcs(input.pcs)} pcs`,
    fields: { pcs: input.pcs, photo_taken_at: input.photo.takenAt },
    files: { photo: input.photo.uri },
  });
}

export function submitTakeRework(input: {
  reworkItemId: number;
  pcs: number;
  photo: Photo | null;
}) {
  return enqueue<{ data: Submission }>({
    kind: 'take_rework',
    path: '/work/take-rework',
    label: `Ambil kerja ulang ${formatPcs(input.pcs)} pcs`,
    dedupeKey: `take_rework:${input.reworkItemId}`,
    fields: { rework_item_id: input.reworkItemId, pcs: input.pcs },
    files: input.photo ? { photo: input.photo.uri } : {},
  });
}

export function submitHandOverRework(input: { reworkItemId: number; pcs: number; photo: Photo }) {
  return enqueue<{ data: Submission }>({
    kind: 'hand_over_rework',
    path: '/work/hand-over-rework',
    label: `Serah kerja ulang ${formatPcs(input.pcs)} pcs`,
    dedupeKey: `hand_over_rework:${input.reworkItemId}`,
    fields: { rework_item_id: input.reworkItemId, pcs: input.pcs },
    files: { photo: input.photo.uri },
  });
}

export function submitWeighing(input: { cardId: number; agree: boolean; reason?: string }) {
  return enqueue<{ data: WorkCard }>({
    kind: 'weighing',
    path: `/work-cards/${input.cardId}/weighing`,
    label: `Konfirmasi hasil timbang (${input.agree ? 'Setuju' : 'Tidak setuju'})`,
    dedupeKey: `weighing:${input.cardId}`,
    json: true,
    fields: input.agree ? { agree: true } : { agree: false, reason: input.reason ?? '' },
  });
}

export interface ReceiveBatchInput {
  batchId: number;
  batchCode: string;
  receivedGram: string;
  receivedPcs: number | null;
  notes: string | null;
  photo: Photo | null;
  container?: {
    container_code?: string | null;
    container_tare?: string | null;
    tare_reason?: string | null;
    bruto?: string | null;
  };
}

export function submitReceiveBatch(input: ReceiveBatchInput) {
  return enqueue<{ data: Batch }>({
    kind: 'receive_batch',
    path: `/batches/${input.batchId}/receive`,
    label: `Terima batch ${input.batchCode} ${formatGram(input.receivedGram)}`,
    dedupeKey: `receive_batch:${input.batchId}`,
    fields: {
      received_qty: input.receivedGram,
      received_pcs: input.receivedPcs,
      receipt_notes: input.notes,
      ...(input.container ? { container: input.container } : {}),
    },
    files: input.photo ? { photo: input.photo.uri } : {},
  });
}

export function submitPrepareBatch(input: {
  batchId: number;
  batchCode: string;
  body: PreparationPayload;
}) {
  return enqueue<{ data: PreparationResult }>({
    kind: 'prepare_batch',
    path: `/batches/${input.batchId}/preparation`,
    label: `Penyiapan batch ${input.batchCode}, G1 ${formatGram(input.body.g1_gram)}`,
    dedupeKey: `prepare_batch:${input.batchId}`,
    json: true,
    fields: { ...input.body },
  });
}
