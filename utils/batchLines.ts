import type { Batch, BatchLine } from '@/types';
import { compareDecimal } from './decimal';

/** Nama item baris; server mengirim {id,name}, terima juga string. Tidak pernah melempar. */
export function lineItemName(item: BatchLine['item'] | undefined): string {
  if (!item) return '-';
  return typeof item === 'string' ? item : (item.name ?? '-');
}

/** Judul stok: `nama` untuk stok gabungan, selain itu nama item baris. */
export function lineName(line: Pick<BatchLine, 'item' | 'nama' | 'stok_gabungan'>): string {
  if (line.stok_gabungan && line.nama && line.nama.trim()) return line.nama.trim();
  return lineItemName(line.item);
}

/** Perkiraan hasil = gram x rendemen (0..1), "2 desimal"; null bila rendemen atau gram kosong. */
export function perkiraanHasil(
  gram: string | null | undefined,
  rendemen: string | null | undefined,
): string | null {
  if (!gram || rendemen == null || rendemen === '') return null;
  const g = Number(gram);
  const r = Number(rendemen);
  if (!Number.isFinite(g) || !Number.isFinite(r)) return null;
  return (Math.round(g * r * 100) / 100).toFixed(2);
}

/** "G3 · Sampingan" untuk baris hasil sampingan, "Grade n" bila ada, selain itu null. */
export function lineGradeText(line: Pick<BatchLine, 'grade' | 'is_byproduct'>): string | null {
  if (line.is_byproduct) return `G${line.grade ?? 3} · Sampingan`;
  return line.grade != null ? `Grade ${line.grade}` : null;
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

/** Baris sampingan yang belum disiapkan: sudah boleh dijatah, boleh juga disiapkan lagi. */
export function isPreparableByproduct(line: BatchLine): boolean {
  return line.is_byproduct === true && !line.prepared;
}

/** Baris G2/G3 yang bisa dipilih untuk Penyiapan per baris (termasuk "Siapkan lagi" sampingan). */
export function preparableLines(batch: Pick<Batch, 'lines'>): BatchLine[] {
  return batchLines(batch).filter(l => lineNeedsPreparation(l) || isPreparableByproduct(l));
}

/** Perlu Penyiapan sungguhan: G2/G3 non-sampingan yang wajib disiapkan sebelum dijatah. */
export function mustPrepareLines(batch: Pick<Batch, 'lines'>): BatchLine[] {
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
