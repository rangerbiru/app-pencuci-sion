import {
  addDecimal,
  compareDecimal,
  parseUserDecimal,
  parseUserInt,
  subDecimal,
} from '@/utils/decimal';
import type { PreparationPayload } from '@/services/batches.service';

export interface PreparationLine {
  key: string;
  itemId: number | null;
  /** nilai polos dari GramInput, mis. "1250.5" */
  gram: string;
  pcs: string;
}

export interface PreparationInput {
  processType: 'kering' | 'basah' | null;
  notes: string;
  lines: PreparationLine[];
}

export type PreparationErrors = {
  processType?: string;
  lines?: string;
  rows: Record<string, { item?: string; gram?: string; pcs?: string }>;
};

export interface PreparationTotals {
  outputGram: string;
  susutGram: string;
  /** hasil lebih besar dari gram masuk */
  over: boolean;
}

export function preparationTotals(inputGram: string, lines: PreparationLine[]): PreparationTotals {
  const outputGram = addDecimal(...lines.map(l => parseUserDecimal(l.gram) ?? '0'));
  const susutGram = subDecimal(inputGram, outputGram);
  return { outputGram, susutGram, over: compareDecimal(outputGram, inputGram) > 0 };
}

/**
 * Validasi Penyiapan sebelum dikirim (server memeriksa lagi): jenis proses wajib, minimal satu
 * hasil, tiap baris punya item dan gram > 0, total hasil tidak melebihi gram masuk.
 */
export function validatePreparation(
  input: PreparationInput,
  inputGram: string,
  /** tanggal "YYYY-MM-DD" (server: tidak boleh setelah hari ini) */
  preparedAt: string,
): { ok: true; body: PreparationPayload } | { ok: false; errors: PreparationErrors } {
  const errors: PreparationErrors = { rows: {} };
  if (!input.processType) errors.processType = 'Pilih proses kering atau basah.';
  if (input.lines.length === 0) errors.lines = 'Tambahkan minimal satu hasil penyiapan.';

  const outputs: PreparationPayload['outputs'] = [];
  for (const l of input.lines) {
    const row: { item?: string; gram?: string; pcs?: string } = {};
    if (!l.itemId) row.item = 'Pilih item hasil.';
    const weight = parseUserDecimal(l.gram);
    if (!l.gram.trim()) row.gram = 'Isi gram hasil.';
    else if (weight === null || compareDecimal(weight, '0') <= 0)
      row.gram = 'Gram harus lebih dari 0.';
    let pcs: number | null = null;
    if (l.pcs.trim()) {
      pcs = parseUserInt(l.pcs);
      if (pcs === null) row.pcs = 'Pcs harus bilangan bulat.';
    }
    if (Object.keys(row).length) errors.rows[l.key] = row;
    else if (l.itemId && weight) outputs.push({ item_id: l.itemId, weight, jumlah_keping: pcs });
  }

  const totals = preparationTotals(inputGram, input.lines);
  if (!errors.lines && totals.over) {
    errors.lines = 'Total hasil melebihi gram batch yang masuk. Periksa gram tiap hasil.';
  }

  const failed = !!errors.processType || !!errors.lines || Object.keys(errors.rows).length > 0;
  if (failed || !input.processType) return { ok: false, errors };
  return {
    ok: true,
    body: {
      prepared_at: preparedAt,
      process_type: input.processType,
      notes: input.notes.trim() || null,
      outputs,
    },
  };
}
