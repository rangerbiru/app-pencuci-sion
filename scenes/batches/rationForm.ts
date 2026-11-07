import { addDecimal, compareDecimal, parseUserDecimal } from '@/utils/decimal';
import { formatGram } from '@/utils/format';

export interface RationLineInput {
  workerId: number | null;
  gram: string;
}

/** Bentuk split (revisi 7/11): beberapa pencuci untuk satu stok gabungan dalam satu permintaan. */
export interface RationAllocation {
  washer_id: number;
  gram: number;
}

/** Petakan galat 422 `allocations.N.*` / `lines.N.*` dari server ke nomor baris. */
export function rowErrorsFromServer(fieldErrors: Record<string, string>): Record<number, string> {
  const out: Record<number, string> = {};
  for (const [key, msg] of Object.entries(fieldErrors)) {
    const m = /^(?:allocations|lines)\.(\d+)\./.exec(key);
    if (m && out[Number(m[1])] === undefined) out[Number(m[1])] = msg;
  }
  return out;
}

/** Validasi penjatahan: tiap baris pencuci + gram > 0, pencuci tidak dobel, total <= sisa batch. */
export function validateRations(
  lines: RationLineInput[],
  remaining: string,
  /** revisi 26/10: baris batch yang dijatahkan; `remaining` lalu berarti sisa_dijatah baris itu */
  batchLineId?: number | null,
) {
  const errors: Record<number, string> = {};
  const parsed: { pencuci_id: number; target_qty: string; batch_line_id?: number }[] = [];
  const allocations: RationAllocation[] = [];
  const seen = new Set<number>();
  lines.forEach((l, i) => {
    const g = parseUserDecimal(l.gram);
    if (l.workerId === null) errors[i] = 'Pilih pencuci.';
    else if (seen.has(l.workerId)) errors[i] = 'Pencuci ini sudah ada di baris lain.';
    else if (g === null || compareDecimal(g, '0') <= 0) errors[i] = 'Isi Gram Jatah lebih dari 0.';
    if (l.workerId !== null) seen.add(l.workerId);
    if (!errors[i] && l.workerId !== null && g !== null) {
      allocations.push({ washer_id: l.workerId, gram: Number(g) });
      parsed.push({
        pencuci_id: l.workerId,
        target_qty: g,
        ...(batchLineId != null ? { batch_line_id: batchLineId } : {}),
      });
    }
  });
  const total = addDecimal(...parsed.map(p => p.target_qty));
  let totalError: string | null = null;
  if (lines.length === 0) totalError = 'Tambah paling sedikit satu pencuci.';
  else if (compareDecimal(total, remaining) > 0)
    totalError = `Total ${formatGram(total)} melebihi sisa ${batchLineId != null ? 'baris' : 'batch'} ${formatGram(remaining)}. Kurangi Gram Jatah.`;
  const ok = Object.keys(errors).length === 0 && !totalError;
  return { ok, errors, totalError, total, lines: parsed, allocations };
}

/** Kode 422 dari POST /rations untuk batch yang belum G1 (revisi 22/10). */
export const GRADE_NOT_READY = 'grade_not_ready';

/** Kode 422 dari POST /rations untuk batch banyak baris tanpa `batch_line_id` (revisi 26/10). */
export const LINE_REQUIRED = 'line_required';

/**
 * Batch belum boleh dijatah: server menandai `ready_for_ration` false / `needs_preparation` true.
 * Server lama tidak mengirim field itu: dianggap siap (server tetap menolak lewat 422).
 */
export function needsPreparation(b: {
  ready_for_ration?: boolean;
  needs_preparation?: boolean;
}): boolean {
  return b.needs_preparation === true || b.ready_for_ration === false;
}
