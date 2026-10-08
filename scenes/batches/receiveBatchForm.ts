import { compareDecimal, parseUserDecimal, parseUserInt, subDecimal } from '@/utils/decimal';
import { formatGram } from '@/utils/format';
import { Container } from '@/types';

export interface ReceiveInput {
  /** gram diterima diketik langsung (tanpa wadah) */
  gram: string;
  /** dengan wadah: bruto ditimbang, tara dari wadah (boleh diubah dengan alasan) */
  bruto: string;
  tare: string;
  tareReason: string;
  pcs: string;
  notes: string;
}

export type ReceiveErrors = Partial<Record<keyof ReceiveInput, string>>;

export interface ReceiveValues {
  receivedGram: string;
  receivedPcs: number | null;
  notes: string | null;
  shrinkGram: string;
  container?: {
    container_code: string | null;
    container_tare: string | null;
    tare_reason: string | null;
    bruto: string;
  };
}

/**
 * Validasi Terima batch (aturan server bagian 8 dan 9):
 * - gram diterima wajib dan tidak boleh melebihi gram kirim
 * - ada selisih -> catatan selisih wajib minimal 5 karakter
 * - dengan wadah: gram = bruto - tara; tara berbeda dari tara wadah wajib alasan minimal 5 karakter
 */
export function validateReceiveBatch(
  input: ReceiveInput,
  sentGram: string,
  container: Container | null,
): { ok: true; values: ReceiveValues } | { ok: false; errors: ReceiveErrors } {
  const errors: ReceiveErrors = {};
  let received: string | null = null;
  let containerValues: ReceiveValues['container'];

  if (container) {
    const bruto = parseUserDecimal(input.bruto);
    const tare = input.tare.trim() ? parseUserDecimal(input.tare) : container.tara_gram;
    if (!input.bruto.trim()) errors.bruto = 'Isi bruto (berat wadah + isi) dari timbangan.';
    else if (bruto === null) errors.bruto = 'Bruto harus berupa angka.';
    if (tare === null) errors.tare = 'Tara harus berupa angka.';
    const tareChanged = tare !== null && compareDecimal(tare, container.tara_gram) !== 0;
    if (tareChanged && input.tareReason.trim().length < 5)
      errors.tareReason = 'Tara berbeda dari tara wadah. Tulis alasannya minimal 5 huruf.';
    if (bruto !== null && tare !== null) {
      received = subDecimal(bruto, tare);
      if (compareDecimal(received, '0') <= 0)
        errors.bruto = 'Bruto harus lebih besar dari tara wadah.';
      containerValues = {
        container_code: container.kode,
        container_tare: tareChanged ? tare : null,
        tare_reason: tareChanged ? input.tareReason.trim() : null,
        bruto,
      };
    }
  } else {
    received = parseUserDecimal(input.gram);
    if (!input.gram.trim()) errors.gram = 'Isi gram yang diterima.';
    else if (received === null) errors.gram = 'Gram harus berupa angka, mis. 5.900.';
    else if (compareDecimal(received, '0') <= 0) errors.gram = 'Gram harus lebih dari 0.';
  }

  const target = container ? 'bruto' : 'gram';
  if (received !== null && compareDecimal(received, sentGram) > 0 && !errors[target]) {
    errors[target] =
      `Gram diterima (${formatGram(received)}) melebihi gram yang dikirim (${formatGram(sentGram)}). Periksa timbangan.`;
  }

  let pcs: number | null = null;
  if (input.pcs.trim()) {
    pcs = parseUserInt(input.pcs);
    if (pcs === null) errors.pcs = 'Pcs harus bilangan bulat.';
  }

  const shrink = received !== null ? subDecimal(sentGram, received) : '0.00';
  const hasShrink = received !== null && compareDecimal(shrink, '0') !== 0;
  if (hasShrink && input.notes.trim().length < 5 && !errors[target]) {
    errors.notes = `Ada selisih ${formatGram(shrink)}. Tulis penyebabnya minimal 5 huruf.`;
  }

  if (Object.keys(errors).length || received === null) return { ok: false, errors };
  return {
    ok: true,
    values: {
      receivedGram: received,
      receivedPcs: pcs,
      notes: input.notes.trim() || null,
      shrinkGram: shrink,
      container: containerValues,
    },
  };
}
