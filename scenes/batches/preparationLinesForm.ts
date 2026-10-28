import {
  addDecimal,
  compareDecimal,
  parseUserDecimal,
  parseUserInt,
  subDecimal,
} from '@/utils/decimal';
import type { PreparationLinesPayload } from '@/services/batches.service';
import type { BatchLine, PreparationGroup } from '@/types';

export type OutputType = 'main' | 'byproduct';

export interface OutputRow {
  key: string;
  type: OutputType;
  itemId: number | null;
  /** nilai polos dari GramInput */
  gram: string;
  pcs: string;
  /** hanya sampingan */
  group: PreparationGroup;
}

export interface PreparationLinesInput {
  lineIds: number[];
  processType: 'kering' | 'basah' | null;
  notes: string;
  outputs: OutputRow[];
}

export interface PreparationLinesErrors {
  lines?: string;
  processType?: string;
  outputs?: string;
  /** total hasil melebihi total masuk */
  total?: string;
  rows: Record<string, { item?: string; gram?: string; pcs?: string }>;
}

export const GROUP_OPTIONS: { value: PreparationGroup; label: string }[] = [
  { value: 'layak_jual', label: 'Jual' },
  { value: 'retur', label: 'Retur' },
  { value: 'layak_produksi', label: 'Produksi' },
];

export function groupLabel(group: PreparationGroup | null | undefined): string | null {
  return GROUP_OPTIONS.find(o => o.value === group)?.label ?? null;
}

const nonNeg = (v: string | null) => v !== null && compareDecimal(v, '0') >= 0;

/** Gram masuk satu baris: yang masih bisa dijatahkan (sama dengan gram diterima bila belum dijatah). */
export function lineInputGram(line: BatchLine): string {
  return line.sisa_dijatah ?? line.gram ?? '0.00';
}

/** Baris yang boleh dipilih bersama: grade harus sama dengan baris yang sudah dipilih. */
export function selectableTogether(line: BatchLine, picked: BatchLine[]): boolean {
  if (picked.length === 0) return true;
  return (picked[0].grade ?? null) === (line.grade ?? null);
}

export interface PreparationLinesTotals {
  inputGram: string;
  outputGram: string;
  /** masuk - semua hasil; negatif ("-120.00") bila ada yang hilang, "0.00" bila pas */
  lostGram: string;
  over: boolean;
  hasMain: boolean;
}

/** Hitung langsung di layar: hilang = masuk - semua hasil, ditampilkan negatif. */
export function preparationLinesTotals(
  lines: BatchLine[],
  outputs: OutputRow[],
): PreparationLinesTotals {
  const inputGram = addDecimal(...lines.map(lineInputGram));
  const outputGram = addDecimal(...outputs.map(o => parseUserDecimal(o.gram) ?? '0'));
  const remaining = subDecimal(inputGram, outputGram);
  const over = compareDecimal(remaining, '0') < 0;
  const lostGram =
    over || compareDecimal(remaining, '0') === 0 ? '0.00' : subDecimal('0', remaining);
  return {
    inputGram,
    outputGram,
    lostGram,
    over,
    hasMain: outputs.some(o => o.type === 'main'),
  };
}

/**
 * Validasi Penyiapan per baris sebelum dikirim (server memeriksa lagi): minimal satu baris,
 * grade sama, jenis proses wajib, tiap hasil punya item dan gram > 0, minimal satu hasil utama G1,
 * total hasil <= total masuk.
 */
export function validatePreparationLines(
  input: PreparationLinesInput,
  lines: BatchLine[],
  /** tanggal "YYYY-MM-DD" (server: tidak boleh setelah hari ini) */
  preparedAt: string,
): { ok: true; body: PreparationLinesPayload } | { ok: false; errors: PreparationLinesErrors } {
  const errors: PreparationLinesErrors = { rows: {} };
  if (lines.length === 0) errors.lines = 'Pilih paling sedikit satu baris yang disiapkan.';
  else if (new Set(lines.map(l => l.grade ?? null)).size > 1) {
    errors.lines = 'Baris yang disiapkan bersama harus satu grade.';
  }
  if (!input.processType) errors.processType = 'Pilih proses kering atau basah.';
  if (input.outputs.length === 0) errors.outputs = 'Tambah paling sedikit satu hasil.';

  const outputs: PreparationLinesPayload['outputs'] = [];
  for (const o of input.outputs) {
    const row: { item?: string; gram?: string; pcs?: string } = {};
    if (!o.itemId) row.item = 'Pilih item hasil.';
    const gram = parseUserDecimal(o.gram);
    if (!o.gram.trim()) row.gram = 'Isi gram hasil.';
    else if (!nonNeg(gram)) row.gram = 'Gram hasil tidak boleh negatif.';
    else if (gram && compareDecimal(gram, '0') === 0) row.gram = 'Gram hasil harus lebih dari 0.';
    let pcs: number | null = null;
    if (o.pcs.trim()) {
      pcs = parseUserInt(o.pcs);
      if (pcs === null) row.pcs = 'Pcs harus bilangan bulat, tidak negatif.';
    }
    if (Object.keys(row).length) errors.rows[o.key] = row;
    else if (o.itemId && gram) {
      outputs.push({
        type: o.type,
        item_id: o.itemId,
        gram,
        pcs,
        ...(o.type === 'byproduct' ? { group: o.group } : {}),
      });
    }
  }

  const totals = preparationLinesTotals(lines, input.outputs);
  if (input.outputs.length > 0 && !totals.hasMain) {
    errors.outputs = 'Minimal satu hasil utama G1.';
  }
  if (totals.over) {
    errors.total = 'Total hasil melebihi total gram masuk. Periksa gram tiap hasil.';
  }

  const failed =
    !!errors.lines ||
    !!errors.processType ||
    !!errors.outputs ||
    !!errors.total ||
    Object.keys(errors.rows).length > 0;
  if (failed || !input.processType) return { ok: false, errors };
  return {
    ok: true,
    body: {
      prepared_at: preparedAt,
      process_type: input.processType,
      notes: input.notes.trim() || null,
      line_ids: lines.map(l => l.id),
      outputs,
    },
  };
}
