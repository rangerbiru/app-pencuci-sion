import {
  addDecimal,
  compareDecimal,
  parseUserDecimal,
  parseUserInt,
  subDecimal,
} from '@/utils/decimal';
import type { PreparationPayload } from '@/services/batches.service';

export interface CrushedLine {
  key: string;
  itemId: number | null;
  /** nilai polos dari GramInput, mis. "80" */
  gram: string;
  pcs: string;
}

export interface PreparationInput {
  processType: 'kering' | 'basah' | null;
  notes: string;
  /** gram G1 hasil timbang */
  g1Gram: string;
  g1Pcs: string;
  /** susut hancur, boleh kosong */
  crushed: CrushedLine[];
}

export type PreparationErrors = {
  processType?: string;
  g1Gram?: string;
  g1Pcs?: string;
  /** G1 + hancur melebihi gram masuk */
  total?: string;
  rows: Record<string, { item?: string; gram?: string; pcs?: string }>;
};

export interface PreparationTotals {
  g1Gram: string;
  crushedGram: string;
  /** masuk - G1 - hancur; negatif bila ada yang hilang (format server: "-120.00") */
  lostGram: string;
  /** G1 + hancur lebih besar dari gram masuk */
  over: boolean;
}

const nonNeg = (v: string | null) => v !== null && compareDecimal(v, '0') >= 0;

/** Hitung langsung di layar: hilang = masuk - G1 - hancur, ditampilkan negatif. */
export function preparationTotals(
  inputGram: string,
  g1Gram: string,
  crushed: CrushedLine[],
): PreparationTotals {
  const g1 = parseUserDecimal(g1Gram) ?? '0.00';
  const crushedGram = addDecimal(...crushed.map(l => parseUserDecimal(l.gram) ?? '0'));
  const remaining = subDecimal(subDecimal(inputGram, g1), crushedGram);
  const over = compareDecimal(remaining, '0') < 0;
  // tampil sebagai angka negatif ("-120.00"); kelebihan ditandai `over`, bukan hilang
  const lostGram =
    over || compareDecimal(remaining, '0') === 0 ? '0.00' : subDecimal('0', remaining);
  return { g1Gram: g1, crushedGram, lostGram, over };
}

/**
 * Validasi Penyiapan sebelum dikirim (server memeriksa lagi): jenis proses wajib, G1 > 0,
 * tidak ada angka negatif, tiap baris hancur punya item dan gram > 0, G1 + hancur <= gram masuk.
 */
export function validatePreparation(
  input: PreparationInput,
  inputGram: string,
  /** tanggal "YYYY-MM-DD" (server: tidak boleh setelah hari ini) */
  preparedAt: string,
): { ok: true; body: PreparationPayload } | { ok: false; errors: PreparationErrors } {
  const errors: PreparationErrors = { rows: {} };
  if (!input.processType) errors.processType = 'Pilih proses kering atau basah.';

  const g1 = parseUserDecimal(input.g1Gram);
  if (!input.g1Gram.trim()) errors.g1Gram = 'Isi gram G1 hasil.';
  else if (!nonNeg(g1)) errors.g1Gram = 'Gram G1 tidak boleh negatif.';
  else if (g1 && compareDecimal(g1, '0') === 0) errors.g1Gram = 'Gram G1 harus lebih dari 0.';

  let g1Pcs: number | null = null;
  if (input.g1Pcs.trim()) {
    g1Pcs = parseUserInt(input.g1Pcs);
    if (g1Pcs === null) errors.g1Pcs = 'Pcs harus bilangan bulat, tidak negatif.';
  }

  const crushed: NonNullable<PreparationPayload['crushed']> = [];
  for (const l of input.crushed) {
    const row: { item?: string; gram?: string; pcs?: string } = {};
    if (!l.itemId) row.item = 'Pilih item susut hancur.';
    const gram = parseUserDecimal(l.gram);
    if (!l.gram.trim()) row.gram = 'Isi gram hancur.';
    else if (!nonNeg(gram)) row.gram = 'Gram hancur tidak boleh negatif.';
    else if (gram && compareDecimal(gram, '0') === 0) row.gram = 'Gram hancur harus lebih dari 0.';
    let pcs: number | null = null;
    if (l.pcs.trim()) {
      pcs = parseUserInt(l.pcs);
      if (pcs === null) row.pcs = 'Pcs harus bilangan bulat, tidak negatif.';
    }
    if (Object.keys(row).length) errors.rows[l.key] = row;
    else if (l.itemId && gram) crushed.push({ item_id: l.itemId, gram, pcs });
  }

  const totals = preparationTotals(inputGram, input.g1Gram, input.crushed);
  if (!errors.g1Gram && totals.over) {
    errors.total = 'G1 ditambah hancur melebihi gram masuk. Periksa gram G1 dan hancur.';
  }

  const failed =
    !!errors.processType ||
    !!errors.g1Gram ||
    !!errors.g1Pcs ||
    !!errors.total ||
    Object.keys(errors.rows).length > 0;
  if (failed || !input.processType || !g1) return { ok: false, errors };
  return {
    ok: true,
    body: {
      prepared_at: preparedAt,
      process_type: input.processType,
      notes: input.notes.trim() || null,
      g1_gram: g1,
      g1_pcs: g1Pcs,
      crushed,
    },
  };
}
