import { WorkCard } from '@/types';
import type { QcOutput, QcPayload } from '@/services/workCards.service';
import { compareDecimal, parseUserDecimal, parseUserInt } from '@/utils/decimal';

export interface QcRowInput {
  /** kunci React; baris dari kartu memakai urutannya, baris baru diberi kunci baru */
  key: string;
  /** 0 = baris baru yang itemnya belum dipilih */
  itemId: number;
  gram: string;
  pcs: string;
}

let rowSeq = 0;

/** Baris hasil baru (item dipilih dari GET /items?purpose=kartu_kerja). */
export function emptyQcRow(): QcRowInput {
  rowSeq += 1;
  return { key: `new-${rowSeq}`, itemId: 0, gram: '', pcs: '' };
}

export interface QcInput {
  status: 'standard' | 'belum_standard' | null;
  reworkDate: string;
  rows: QcRowInput[];
}

export type QcErrors = { status?: string; reworkDate?: string; rows: Record<number, string> };

export function initialQcInput(card: WorkCard): QcInput {
  return {
    status: card.qc_status?.code ?? null,
    reworkDate: card.rework_date ?? '',
    rows: card.result.rows.map((r, i) => ({
      key: `row-${i}`,
      itemId: r.item_id,
      // nilai polos untuk GramInput ("300", "300.5"); titik ribuan ditambahkan isiannya
      gram: r.gram ? r.gram.replace(/\.00$/, '') : '',
      pcs: r.pcs != null ? String(r.pcs) : '',
    })),
  };
}

/** "dd/mm/yyyy" atau "yyyy-mm-dd" -> "yyyy-mm-dd" */
export function parseUserDate(input: string): string | null {
  const s = input.trim();
  let m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (m) return s;
  m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s);
  if (!m) return null;
  return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
}

/**
 * Validasi QC sama dengan web: status wajib; Lolos QC (Standard) wajib gram hasil bersih semua
 * baris; Belum Standard wajib tanggal kerja ulang.
 */
export function validateQc(
  input: QcInput,
  card: WorkCard,
): { ok: true; payload: QcPayload } | { ok: false; errors: QcErrors } {
  const errors: QcErrors = { rows: {} };
  if (!input.status) errors.status = 'Pilih hasil QC: Standard atau Belum Standard.';
  let reworkDate: string | null = null;
  if (input.status === 'belum_standard') {
    reworkDate = parseUserDate(input.reworkDate);
    if (!input.reworkDate.trim()) errors.reworkDate = 'Isi tanggal kerja ulang.';
    else if (!reworkDate) errors.reworkDate = 'Tanggal harus dd/mm/yyyy, mis. 25/09/2026.';
  }
  const outputs: QcOutput[] = input.rows.map((r, i) => {
    const source = card.result.rows[i];
    const gram = r.gram.trim() ? parseUserDecimal(r.gram) : null;
    const pcs = r.pcs.trim() ? parseUserInt(r.pcs) : null;
    if (r.gram.trim() && gram === null) errors.rows[i] = 'Gram harus berupa angka.';
    else if (gram !== null && compareDecimal(gram, '0') < 0)
      errors.rows[i] = 'Gram tidak boleh minus.';
    else if (input.status === 'standard' && gram === null)
      errors.rows[i] = 'Lolos QC wajib mengisi gram hasil bersih.';
    if (r.pcs.trim() && pcs === null) errors.rows[i] = 'Pcs harus bilangan bulat.';
    if (!r.itemId) errors.rows[i] = 'Pilih item hasil untuk baris ini.';
    return {
      item_id: r.itemId,
      jumlah_keping_lembab: source?.pcs_lembab ?? null,
      weight_clean: gram,
      jumlah_keping_clean: pcs,
      retur_tujuan: source?.retur_tujuan ?? null,
    };
  });
  if (errors.status || errors.reworkDate || Object.keys(errors.rows).length)
    return { ok: false, errors };
  return {
    ok: true,
    payload: {
      qc_status: input.status as 'standard' | 'belum_standard',
      rework_date: reworkDate,
      outputs,
    },
  };
}
