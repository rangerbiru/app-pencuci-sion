/**
 * Angka desimal dari API (uang, gram) berupa string 2 desimal. Untuk membandingkan atau
 * menjumlah tanpa float, string diubah ke bilangan bulat seperseratus (BigInt).
 */

const DECIMAL_RE = /^(-)?(\d+)(?:[.,](\d+))?$/;

/** "12500.5" -> 1250050n. Mengembalikan null bila bukan angka. */
export function toCents(value: string | number | null | undefined): bigint | null {
  if (value === null || value === undefined) return null;
  const raw = String(value).trim();
  const m = DECIMAL_RE.exec(raw);
  if (!m) return null;
  const [, minus, int, frac = ''] = m;
  const frac2 = (frac + '00').slice(0, 2);
  const cents = BigInt(int) * 100n + BigInt(frac2);
  return minus ? -cents : cents;
}

/** 1250050n -> "12500.50" */
export function fromCents(cents: bigint): string {
  const neg = cents < 0n;
  const abs = neg ? -cents : cents;
  const int = abs / 100n;
  const frac = (abs % 100n).toString().padStart(2, '0');
  return `${neg ? '-' : ''}${int.toString()}.${frac}`;
}

export function compareDecimal(a: string, b: string): number {
  const x = toCents(a) ?? 0n;
  const y = toCents(b) ?? 0n;
  return x === y ? 0 : x > y ? 1 : -1;
}

export function addDecimal(...values: (string | null | undefined)[]): string {
  return fromCents(values.reduce<bigint>((sum, v) => sum + (toCents(v) ?? 0n), 0n));
}

export function subDecimal(a: string, b: string): string {
  return fromCents((toCents(a) ?? 0n) - (toCents(b) ?? 0n));
}

/**
 * Isian angka dari pengguna ("1.250,5" atau "1250.5") ke string API "1250.50".
 * Titik dianggap pemisah ribuan bila ada koma, atau bila diikuti tepat 3 angka.
 */
export function parseUserDecimal(input: string): string | null {
  let s = input.replace(/\s/g, '').replace(/[^\d.,-]/g, '');
  if (!s) return null;
  if (s.includes(',')) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (/^\d{1,3}(\.\d{3})+$/.test(s)) {
    s = s.replace(/\./g, '');
  }
  const cents = toCents(s);
  return cents === null ? null : fromCents(cents);
}

/** Bagian bulat >= 0 dari isian pcs; null bila kosong/tidak valid. */
export function parseUserInt(input: string): number | null {
  const s = input.replace(/[.\s]/g, '');
  if (!/^\d+$/.test(s)) return null;
  return parseInt(s, 10);
}
