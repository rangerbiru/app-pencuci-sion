import { compareDecimal, parseUserDecimal, parseUserInt } from '@/utils/decimal';
import { formatGram } from '@/utils/format';

export interface TakeMaterialInput {
  gram: string;
  pcs: string;
}

export interface TakeMaterialValues {
  weight: string;
  pcs: number | null;
}

export type TakeMaterialErrors = Partial<Record<'gram' | 'pcs', string>>;

/**
 * Validasi ambil bahan di HP sebelum dikirim (server memeriksa lagi dengan aturan yang sama):
 * gram wajib, lebih dari 0, dan tidak melebihi sisa jatah; pcs opsional bilangan bulat.
 */
export function validateTakeMaterial(
  input: TakeMaterialInput,
  remainingGram: string,
): { ok: true; values: TakeMaterialValues } | { ok: false; errors: TakeMaterialErrors } {
  const errors: TakeMaterialErrors = {};
  const weight = parseUserDecimal(input.gram);
  if (!input.gram.trim()) errors.gram = 'Isi gram sesuai angka di timbangan.';
  else if (weight === null) errors.gram = 'Gram harus berupa angka, mis. 1.250,5.';
  else if (compareDecimal(weight, '0') <= 0) errors.gram = 'Gram harus lebih dari 0.';
  else if (compareDecimal(weight, remainingGram) > 0)
    errors.gram = `Gram (${formatGram(weight, { style: 'table' })}) melebihi sisa jatah (${formatGram(remainingGram, { style: 'table' })}). Kurangi gramnya.`;

  let pcs: number | null = null;
  if (input.pcs.trim()) {
    pcs = parseUserInt(input.pcs);
    if (pcs === null) errors.pcs = 'Pcs harus bilangan bulat, mis. 120.';
  }

  if (Object.keys(errors).length || weight === null) return { ok: false, errors };
  return { ok: true, values: { weight, pcs } };
}
