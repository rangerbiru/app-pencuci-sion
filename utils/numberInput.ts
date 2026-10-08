/**
 * Isian angka yang diformat saat diketik: titik ribuan, koma desimal (gaya Indonesia).
 * `value` = string angka untuk API tanpa titik ribuan ("1000000", "1250.5");
 * `display` = yang terlihat di isian ("1.000.000", "1.250,5").
 */

export interface NumberInputState {
  display: string;
  value: string;
}

const EMPTY: NumberInputState = { display: '', value: '' };

function groupThousands(int: string): string {
  return int.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function stripLeadingZeros(int: string): string {
  const s = int.replace(/^0+(?=\d)/, '');
  return s;
}

/**
 * Pisahkan teks (ketikan atau tempelan) menjadi bagian bulat dan desimal.
 * - koma selalu desimal ("1.250,5", "Rp 1.000.000,00")
 * - tanpa koma: titik yang diikuti tepat 3 angka per kelompok = ribuan ("1.000.000"),
 *   satu titik dengan 1-2 angka di belakang = desimal ("1250.5" dari kalkulator/timbangan)
 */
function splitNumber(raw: string): { int: string; frac: string | null } | null {
  const s = raw.replace(/[^\d.,]/g, '');
  if (!s) return null;
  const comma = s.indexOf(',');
  if (comma >= 0) {
    const int = s.slice(0, comma).replace(/\D/g, '');
    const frac = s.slice(comma + 1).replace(/\D/g, '');
    return { int, frac };
  }
  const dotDecimal = /^(\d+)\.(\d{0,2})$/.exec(s);
  if (dotDecimal && !/^\d{1,3}\.\d{3}$/.test(s)) {
    return { int: dotDecimal[1], frac: dotDecimal[2] };
  }
  return { int: s.replace(/\D/g, ''), frac: null };
}

/**
 * Format teks isian. `decimals` = 0 untuk rupiah dan pcs, 2 untuk gram.
 * `prevDisplay` dipakai untuk mengenali titik yang baru diketik sebagai koma desimal
 * (papan angka sebagian HP hanya punya titik).
 */
export function formatNumberInput(
  raw: string,
  decimals: number,
  prevDisplay = '',
): NumberInputState {
  let text = raw;
  const typedDot =
    decimals > 0 &&
    text.endsWith('.') &&
    text.length === prevDisplay.length + 1 &&
    !prevDisplay.includes(',');
  if (typedDot) text = `${text.slice(0, -1)},`;

  const parts = splitNumber(text);
  if (!parts) return EMPTY;
  const int = stripLeadingZeros(parts.int || (parts.frac !== null ? '0' : ''));
  if (!int) return EMPTY;
  if (decimals === 0 || parts.frac === null) {
    return { display: groupThousands(int), value: int };
  }
  const frac = parts.frac.slice(0, decimals);
  return {
    display: `${groupThousands(int)},${frac}`,
    value: frac ? `${int}.${frac}` : int,
  };
}

/** Tampilan awal dari nilai API ("1250.50" -> "1.250,5" untuk gram, "1.250" untuk rupiah). */
export function displayFromValue(value: string | null | undefined, decimals: number): string {
  if (!value) return '';
  const m = /^(-?)(\d+)(?:\.(\d+))?$/.exec(value.trim());
  if (!m) return '';
  const int = stripLeadingZeros(m[2]);
  const frac = (m[3] ?? '').slice(0, decimals).replace(/0+$/, '');
  return frac && decimals > 0 ? `${groupThousands(int)},${frac}` : groupThousands(int);
}
