import type { Batch } from '@/types';
import { compareDecimal } from '@/utils/decimal';
import type { SusutInput } from '@/utils/susut';

const has = (v: string | null | undefined): v is string => !!v && compareDecimal(v, '0') !== 0;

/**
 * Susut penerimaan batch untuk komponen Susut. Server baru mengirim `receipt_crushed_gram` dan
 * `receipt_lost_gram`; data lama hanya punya `receipt_shrink_gram` (satu angka), tampil sebagai
 * Hilang. null = tidak ada susut yang perlu ditampilkan.
 */
export function batchSusut(b: Batch): SusutInput | null {
  const crushed = has(b.receipt_crushed_gram) ? b.receipt_crushed_gram : null;
  const lost = has(b.receipt_lost_gram) ? b.receipt_lost_gram : null;
  const legacy =
    !crushed && !lost && b.receipt_lost_gram == null && has(b.receipt_shrink_gram)
      ? b.receipt_shrink_gram
      : null;
  if (!crushed && !lost && !legacy) return null;
  return { crushedGram: crushed, lostGram: lost, legacyGram: legacy, baseGram: b.sent_gram };
}
