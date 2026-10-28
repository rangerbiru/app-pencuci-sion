import type { Batch, BatchLine } from '@/types';
import { compareDecimal } from './decimal';

/** Nama item baris; server mengirim {id,name}, terima juga string. Tidak pernah melempar. */
export function lineItemName(item: BatchLine['item'] | undefined): string {
  if (!item) return '-';
  return typeof item === 'string' ? item : (item.name ?? '-');
}

/** Baris masih perlu Penyiapan (G2/G3). Server lama tanpa `needs_preparation`: turun dari grade. */
export function lineNeedsPreparation(line: BatchLine): boolean {
  if (line.prepared) return false;
  if (line.needs_preparation !== undefined) return line.needs_preparation === true;
  return line.grade != null && line.grade !== 1;
}

/** Baris G1 yang bisa dijatahkan: belum disiapkan ulang, siap, dan masih ada sisa. */
export function isRationableLine(line: BatchLine): boolean {
  if (line.prepared || lineNeedsPreparation(line)) return false;
  return line.sisa_dijatah == null || compareDecimal(line.sisa_dijatah, '0') > 0;
}

export function batchLines(batch: Pick<Batch, 'lines'>): BatchLine[] {
  return Array.isArray(batch.lines) ? batch.lines : [];
}

/** Baris yang masih berlaku (yang sudah disiapkan diganti baris G1 hasilnya). */
export function activeLines(batch: Pick<Batch, 'lines'>): BatchLine[] {
  return batchLines(batch).filter(l => !l.prepared);
}

export function rationableLines(batch: Pick<Batch, 'lines'>): BatchLine[] {
  return batchLines(batch).filter(isRationableLine);
}

/** Baris G2/G3 yang bisa dipilih untuk Penyiapan per baris. */
export function preparableLines(batch: Pick<Batch, 'lines'>): BatchLine[] {
  return batchLines(batch).filter(lineNeedsPreparation);
}

/** Batch berisi lebih dari satu baris: penjatahan wajib memilih baris. */
export function isMultiLine(batch: Pick<Batch, 'lines'>): boolean {
  return activeLines(batch).length > 1;
}

/** "NP-001" atau null; batch gabungan lama tidak punya nota. */
export function notaText(nota: string | null | undefined): string | null {
  return nota && nota.trim() ? `Nota ${nota.trim()}` : null;
}

/** "Batch B-001 · Nota NP-001" untuk kartu jatah, pengajuan, dan kartu kerja. */
export function batchNotaText(batchCode: string | null | undefined, nota?: string | null): string {
  return [batchCode ? `Batch ${batchCode}` : null, notaText(nota)].filter(Boolean).join(' · ');
}
