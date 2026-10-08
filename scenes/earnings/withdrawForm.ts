import { compareDecimal, parseUserDecimal } from '@/utils/decimal';
import { formatRupiah } from '@/utils/format';

/** Nominal penarikan: >= minimal dan <= saldo. Dibandingkan sebagai string desimal. */
export function validateWithdrawAmount(
  input: string,
  min: string,
  max: string,
): { ok: true; amount: string } | { ok: false; error: string } {
  const amount = parseUserDecimal(input);
  if (!input.trim()) return { ok: false, error: 'Isi nominal yang ingin ditarik.' };
  if (amount === null) return { ok: false, error: 'Nominal harus berupa angka, mis. 100.000.' };
  if (compareDecimal(amount, min) < 0)
    return { ok: false, error: `Nominal paling sedikit ${formatRupiah(min, { style: 'whole' })}.` };
  if (compareDecimal(amount, max) > 0)
    return {
      ok: false,
      error: `Nominal melebihi saldo (${formatRupiah(max, { style: 'whole' })}). Kurangi nominalnya.`,
    };
  return { ok: true, amount };
}
