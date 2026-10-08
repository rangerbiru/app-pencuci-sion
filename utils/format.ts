import { toCents } from './decimal';

/**
 * Format angka sesuai web SION (docs/web-theme/README.md bagian "Format angka dan tanggal").
 * Masukan berupa string desimal dari API; tidak pernah diubah ke float.
 */

const EMPTY = '-';

function groupThousands(int: string): string {
  return int.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function split(value: string | number | null | undefined) {
  const cents = toCents(value ?? null);
  if (cents === null) return null;
  const neg = cents < 0n;
  const abs = neg ? -cents : cents;
  return {
    neg,
    int: groupThousands((abs / 100n).toString()),
    frac: (abs % 100n).toString().padStart(2, '0'),
    whole: abs % 100n === 0n,
  };
}

export interface RupiahOptions {
  /**
   * 'full' = Rp 30.000, atau Rp 1.234,50 bila memang ada sen (tidak pernah ",00");
   * 'whole' = selalu tanpa sen, Rp 1.234 (saldo besar); 'compact' = Rp6.450 / Rp41,05
   */
  style?: 'full' | 'whole' | 'compact';
}

export function formatRupiah(
  value: string | number | null | undefined,
  { style = 'full' }: RupiahOptions = {},
): string {
  const p = split(value);
  if (!p) return EMPTY;
  const sign = p.neg ? '-' : '';
  if (style === 'compact') return `${sign}Rp${p.int}${p.whole ? '' : `,${p.frac}`}`;
  if (style === 'whole') return `${sign}Rp ${p.int}`;
  return `${sign}Rp ${p.int}${p.whole ? '' : `,${p.frac}`}`;
}

/** "1.224 gr" / "1.224,50 gr": desimal hanya bila tidak bulat. */
export function formatGram(
  value: string | number | null | undefined,
  { unit = true }: { unit?: boolean } = {},
): string {
  const p = split(value);
  if (!p) return EMPTY;
  const num = `${p.neg ? '-' : ''}${p.int}${p.whole ? '' : `,${p.frac}`}`;
  return unit ? `${num} gr` : num;
}

export function formatPcs(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return EMPTY;
  const n = typeof value === 'number' ? Math.trunc(value) : parseInt(value, 10);
  if (Number.isNaN(n)) return EMPTY;
  return `${n < 0 ? '-' : ''}${groupThousands(String(Math.abs(n)))}`;
}

export function formatPercent(value: string | number | null | undefined): string {
  const p = split(value);
  if (!p) return EMPTY;
  return `${p.neg ? '-' : ''}${p.int},${p.frac}%`;
}

/** Rasio progres 0..1 dari dua string desimal, hanya untuk lebar bilah (bukan uang). */
export function progressRatio(
  achieved: string | null | undefined,
  target: string | null | undefined,
) {
  const a = toCents(achieved ?? null);
  const t = toCents(target ?? null);
  if (a === null || t === null || t <= 0n) return 0;
  const permille = Number((a * 1000n) / t);
  return Math.max(0, Math.min(1, permille / 1000));
}
